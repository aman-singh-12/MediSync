import React, { useRef, useEffect } from 'react';
import styles from './OtpInput.module.css';

const OtpInput = ({ length = 6, value = "", onChange, error }) => {
  const inputRefs = useRef([]);

  // Split the value string into an array, padding with empty strings if needed
  const otpArray = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (index, val) => {
    const cleaned = val.replace(/\D/g, '');
    const nextValueArray = [...otpArray];
    nextValueArray[index] = cleaned.slice(-1);
    const nextValue = nextValueArray.join('');
    
    onChange(nextValue);

    // Auto-focus next input
    if (cleaned && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className={styles.otpWrap}>
      <div className={styles.otpRow} onPaste={handlePaste}>
        {otpArray.map((digit, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            type="text"
            maxLength={1}
            inputMode="numeric"
            autoComplete="one-time-code"
            className={`${styles.otpInput} ${digit ? styles.otpInputFilled : ''} ${error ? styles.otpInputError : ''}`}
            value={digit}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>
      {error && <p className={styles.errorText}>{error}</p>}
    </div>
  );
};

export default OtpInput;
