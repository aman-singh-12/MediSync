import styles from "./Button.module.css";

const Button = ({
  children,
  type = "button",
  loading = false,
  disabled = false,
  variant = "primary",
  onClick,
  style = {},
  className = ""
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      style={style}
      className={`${styles.button} ${styles[variant] || styles.primary} ${
        isDisabled ? styles.disabled : ""
      } ${className}`}
      onClick={onClick}
    >
      {loading ? (
        <span className={styles.loadingWrap}>
          <span className={styles.spinner} />
          Please wait...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;