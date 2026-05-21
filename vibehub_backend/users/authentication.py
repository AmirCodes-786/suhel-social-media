import jwt
import logging
import requests
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework import authentication, exceptions
from users.models import Profile

logger = logging.getLogger(__name__)
_JWKS_KEYS_CACHE = {}  # Map of kid -> Public Key

User = get_user_model()

class SupabaseAuthentication(authentication.BaseAuthentication):
    def _get_auth_header(self, request):
        auth_header = None
        if hasattr(request, 'headers'):
            auth_header = request.headers.get('Authorization')
        if not auth_header:
            auth_header = request.META.get('HTTP_AUTHORIZATION')
        logger.debug('Authorization header raw: %s', auth_header)
        return auth_header

    def _extract_token(self, auth_header):
        if not auth_header:
            return None
        parts = auth_header.split()
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            logger.warning('Invalid Authorization header format: %s', auth_header)
            return None
        return parts[1]

    def _get_public_key_from_jwks(self, kid):
        global _JWKS_KEYS_CACHE
        if kid in _JWKS_KEYS_CACHE:
            return _JWKS_KEYS_CACHE[kid]

        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        supabase_anon_key = getattr(settings, 'SUPABASE_ANON_KEY', None)
        if not supabase_url:
            return None

        jwks_endpoint = f"{supabase_url.rstrip('/')}/auth/v1/.well-known/jwks.json"
        headers = {}
        if supabase_anon_key:
            headers['apikey'] = supabase_anon_key

        try:
            logger.info('Fetching JWKS keys from Supabase: %s', jwks_endpoint)
            response = requests.get(jwks_endpoint, headers=headers, timeout=5)
            if response.status_code == 200:
                jwks = response.json()
                for key_data in jwks.get('keys', []):
                    current_kid = key_data.get('kid')
                    if current_kid:
                        try:
                            pub_key = jwt.algorithms.ECAlgorithm.from_jwk(key_data)
                            _JWKS_KEYS_CACHE[current_kid] = pub_key
                            logger.info('Successfully parsed and cached JWK for kid=%s', current_kid)
                        except Exception as e:
                            logger.warning('Failed to parse JWK key %s: %s', current_kid, str(e))
                return _JWKS_KEYS_CACHE.get(kid)
            else:
                logger.warning('Failed to fetch JWKS from Supabase: %s %s', response.status_code, response.text)
        except Exception as exc:
            logger.warning('Error fetching JWKS keys: %s', str(exc))
        return None

    def _verify_with_supabase_api(self, token):
        supabase_url = getattr(settings, 'SUPABASE_URL', None)
        if not supabase_url:
            return None

        user_endpoint = f"{supabase_url.rstrip('/')}/auth/v1/user"
        headers = {
            'Authorization': f'Bearer {token}',
            'Accept': 'application/json',
        }
        supabase_anon_key = getattr(settings, 'SUPABASE_ANON_KEY', None)
        if supabase_anon_key:
            headers['apikey'] = supabase_anon_key

        try:
            response = requests.get(
                user_endpoint,
                headers=headers,
                timeout=5,
            )
            if response.status_code == 200:
                data = response.json()
                if data.get('id'):
                    logger.debug('Supabase API verified token for user id=%s', data.get('id'))
                    return {
                        'sub': data.get('id'),
                        'email': data.get('email'),
                        'user_metadata': data.get('user_metadata') or {},
                    }
                logger.warning('Supabase API returned no user id for token')
            else:
                logger.warning('Supabase API token verification failed: %s %s', response.status_code, response.text)
        except requests.RequestException as exc:
            logger.warning('Supabase API request failed: %s', str(exc))
        return None

    def _decode_token(self, token):
        try:
            unverified_header = jwt.get_unverified_header(token)
            alg = unverified_header.get('alg', 'HS256')

            if alg == 'HS256':
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=['HS256'],
                    options={'verify_aud': False},
                )
            else:
                kid = unverified_header.get('kid')
                if not kid:
                    raise exceptions.AuthenticationFailed('Asymmetric token missing kid in header')

                public_key = self._get_public_key_from_jwks(kid)
                if not public_key:
                    raise exceptions.AuthenticationFailed('Could not retrieve public key for token')

                payload = jwt.decode(
                    token,
                    public_key,
                    algorithms=[alg],
                    options={'verify_aud': False},
                )

            logger.debug('Decoded Supabase JWT payload: %s', {
                'sub': payload.get('sub'),
                'email': payload.get('email'),
                'exp': payload.get('exp'),
                'role': payload.get('role'),
            })
            return payload
        except jwt.ExpiredSignatureError:
            logger.warning('Supabase JWT expired')
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.InvalidTokenError as exc:
            logger.warning('Supabase JWT invalid: %s', str(exc))
            if getattr(settings, 'SUPABASE_URL', None):
                verified_payload = self._verify_with_supabase_api(token)
                if verified_payload:
                    return verified_payload
            raise exceptions.AuthenticationFailed('Invalid Supabase access token')

    def authenticate(self, request):
        auth_header = self._get_auth_header(request)
        token = self._extract_token(auth_header)
        logger.debug('AUTH HEADER: %s', auth_header)
        logger.debug('TOKEN PRESENT: %s', bool(token))

        if not token:
            return None

        payload = self._decode_token(token)
        supabase_uid = payload.get('sub')
        email = payload.get('email')
        user_metadata = payload.get('user_metadata', {}) or {}

        if not supabase_uid:
            logger.error('Decoded payload missing supabase sub/uid: %s', payload)
            raise exceptions.AuthenticationFailed('Invalid Supabase token payload')

        username = user_metadata.get('user_name') or user_metadata.get('username')
        if not username and email:
            username = email.split('@')[0]
        if not username:
            username = f'user_{supabase_uid[:8]}'

        if User.objects.filter(username=username).exclude(id=supabase_uid).exists():
            username = f'{username}_{supabase_uid[:4]}'

        try:
            user = User.objects.filter(id=supabase_uid).first()
            if not user and email:
                user = User.objects.filter(email=email).first()
                if user:
                    logger.debug('Mapped existing Django user by email %s to Supabase id %s', email, supabase_uid)

            if not user:
                user = User.objects.create(
                    id=supabase_uid,
                    username=username,
                    email=email or f'{username}@vibehub.user',
                )
                user.set_unusable_password()
                user.save()
                logger.debug('Created Django user from Supabase payload: id=%s email=%s username=%s', supabase_uid, email, username)

            Profile.objects.get_or_create(user=user)
        except Exception as exc:
            logger.exception('Error syncing Supabase user to Django: %s', exc)
            raise exceptions.AuthenticationFailed('Unable to sync Supabase user')

        logger.debug('Authenticated Django user: %s (id=%s)', user.username, user.id)
        return (user, token)
