import styles from "./RoleSelector.module.css";

const roleOptions = [
  {
    value: "patient",
    title: "Patient",
    subtitle: "Book appointments and manage medical records.",
  },
  {
    value: "doctor",
    title: "Doctor",
    subtitle: "Manage consultations and patient schedules.",
  },
];

const RoleSelector = ({ value, onChange }) => {
  return (
    <div className={styles.wrapper}>
      {roleOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          className={`${styles.card} ${value === option.value ? styles.active : ""}`}
          onClick={() => onChange(option.value)}
        >
          <span className={styles.title}>{option.title}</span>
          <span className={styles.subtitle}>{option.subtitle}</span>
        </button>
      ))}
    </div>
  );
};

export default RoleSelector;