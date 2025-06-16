import { Link } from 'react-router-dom';
import { FaHome, FaRocket, FaGhost } from 'react-icons/fa';
import { motion } from 'framer-motion'; // eslint-disable-line
import styles from './PageNotFound.module.css';

const NotFound = () => {
  const floatingElements = Array.from({ length: 6 }, (_, i) => (
    <motion.div
      key={i}
      className={styles.floatingElement}
      animate={{
        y: [0, -20, 0],
        x: [0, Math.random() * 20 - 10, 0],
        rotate: [0, Math.random() * 10 - 5, 0],
      }}
      transition={{
        duration: 3 + Math.random() * 2,
        repeat: Infinity,
        delay: Math.random() * 2,
      }}
      style={{
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
    >
      ⭐
    </motion.div>
  ));

  return (
    <div className={styles.container}>
      {/* Animated Background Elements */}
      <div className={styles.backgroundElements}>
        {floatingElements}
      </div>

      {/* Main Content */}
      <motion.div
        className={styles.content}
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {/* Animated Ghost Icon */}
        <motion.div
          className={styles.ghostContainer}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, ease: "backOut", delay: 0.2 }}
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <FaGhost className={styles.ghostIcon} />
          </motion.div>
        </motion.div>

        {/* 404 Text with Gradient */}
        <motion.div
          className={styles.errorCode}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.7, ease: "backOut", delay: 0.4 }}
        >
          <span className={styles.errorNumber}>4</span>
          <motion.span 
            className={styles.errorZero}
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            0
          </motion.span>
          <span className={styles.errorNumber}>4</span>
        </motion.div>

        {/* Title with Typing Effect */}
        <motion.h1
          className={styles.title}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          Oops! Page Not Found
        </motion.h1>

        {/* Description */}
        <motion.p
          className={styles.description}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          The page you're looking for seems to have vanished into the digital void.
          <br />
          Don't worry, it happens to the best of us!
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          className={styles.actionButtons}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <Link to="/" className={styles.primaryButton}>
            <FaHome className={styles.buttonIcon} />
            Take Me Home
          </Link>
          <button 
            onClick={() => window.history.back()} 
            className={styles.secondaryButton}
          >
            <FaRocket className={styles.buttonIcon} />
            Go Back
          </button>
        </motion.div>

        {/* Fun Message */}
        <motion.div
          className={styles.funMessage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        >
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;