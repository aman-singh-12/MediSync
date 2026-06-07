import styles from "./InputField.module.css";

const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  required = false,
  autoComplete = "off",
  min,
  max,
  step,
  maxLength,
  inputMode,
  disabled = false,
  helperText,
  trailingButtonText,
  onTrailingButtonClick,
  trailingButtonAriaLabel,
  onKeyUp,
  onKeyDown,
  onPaste,
}) => {
  const hasTrailingButton = Boolean(trailingButtonText && onTrailingButtonClick);

  return (
    <div className={styles.field}>
      <label htmlFor={name} className={styles.label}>
        {label}
        {required ? <span className={styles.required}>*</span> : null}
      </label>

      <div className={styles.inputShell}>
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          maxLength={maxLength}
          inputMode={inputMode}
          disabled={disabled}
          onKeyUp={onKeyUp}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className={`${styles.input} ${error ? styles.errorInput : ""} ${
            hasTrailingButton ? styles.inputWithButton : ""
          }`}
        />

        {hasTrailingButton ? (
          <button
            type="button"
            className={styles.trailingButton}
            onClick={onTrailingButtonClick}
            aria-label={trailingButtonAriaLabel || trailingButtonText}
          >
            {trailingButtonText}
          </button>
        ) : null}
      </div>

      {helperText ? <p className={styles.helperText}>{helperText}</p> : null}

      {error ? <p className={styles.errorText}>{error}</p> : null}
    </div>
  );
};

export default InputField;