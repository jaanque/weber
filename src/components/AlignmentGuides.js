import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './AlignmentGuides.css';

const AlignmentGuides = ({ guides }) => {
  const guideVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  return (
    <div className="alignment-guides">
      <AnimatePresence>
        {guides.map((guide, index) => (
          <motion.div
            key={index}
            className={`guide ${guide.type}`} // Use 'type' from Canvas.js: 'vertical' or 'horizontal'
            style={{
              [guide.type === 'vertical' ? 'left' : 'top']: guide.position,
              [guide.type === 'vertical' ? 'top' : 'left']: 0,
              [guide.type === 'vertical' ? 'width' : 'height']: '1px',
              [guide.type === 'vertical' ? 'height' : 'width']: '100%',
            }}
            variants={guideVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default AlignmentGuides;