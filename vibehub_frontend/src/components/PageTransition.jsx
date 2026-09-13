import React from 'react'
import { motion } from 'framer-motion'

const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
    scale: 0.99
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -8,
    scale: 0.99
  }
}

const pageTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8
}

const PageTransition = ({ children, className = '' }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  )
}

export default PageTransition
