import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/Button";
import useAuth from "../../hooks/useAuth";
import { upsertMyPatientProfile } from "../../services/patient.service";
import styles from "./OnboardingSurvey.module.css";

const BLOOD_GROUPS = ["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const getTodayDate = () => {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	return `${now.getFullYear()}-${month}-${day}`;
};

const OnboardingSurvey = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const [form, setForm] = useState({
		dateOfBirth: "",
		bloodGroup: "",
		allergies: [""],
	});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const maxDob = getTodayDate();

	useEffect(() => {
		if (user?.role && user.role !== "patient") {
			navigate("/home", { replace: true });
		}
	}, [navigate, user?.role]);

	const handleChange = (event) => {
		const { name, value } = event.target;
		setForm((prev) => ({ ...prev, [name]: value }));
		setError("");
	};

	const handleAllergyChange = (index, value) => {
		setForm((prev) => {
			const nextAllergies = [...prev.allergies];
			nextAllergies[index] = value;
			return { ...prev, allergies: nextAllergies };
		});
		setError("");
	};

	const addAllergyField = () => {
		setForm((prev) => ({ ...prev, allergies: [...prev.allergies, ""] }));
	};

	const removeAllergyField = (index) => {
		setForm((prev) => {
			if (prev.allergies.length === 1) {
				return { ...prev, allergies: [""] };
			}

			return {
				...prev,
				allergies: prev.allergies.filter((_, itemIndex) => itemIndex !== index),
			};
		});
	};

	const goToDashboard = () => {
		navigate("/home", { replace: true });
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		setLoading(true);
		setError("");

		try {
			if (form.dateOfBirth && form.dateOfBirth > maxDob) {
				setError("Date of birth cannot be in the future.");
				setLoading(false);
				return;
			}

			const allergies = form.allergies.map((item) => item.trim()).filter(Boolean);

			await upsertMyPatientProfile({
				dateOfBirth: form.dateOfBirth || undefined,
				bloodGroup: form.bloodGroup || undefined,
				allergies,
			});

			goToDashboard();
		} catch (requestError) {
			setError(
				requestError?.response?.data?.message ||
					requestError?.message ||
					"Unable to save your onboarding survey right now."
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className={styles.page}>
			<section className={styles.card}>
				<button
					type="button"
					className={styles.skipButtonTop}
					onClick={goToDashboard}
					disabled={loading}
				>
					Skip
				</button>

				<p className={styles.step}>Step 3 of 3</p>
				<h1 className={styles.title}>One last thing before your dashboard</h1>
				<p className={styles.subtitle}>
					Share a few health details so MediSync can personalize your records.
				</p>

				<form className={styles.form} onSubmit={handleSubmit} noValidate>
					<div className={styles.field}>
						<label className={styles.label} htmlFor="dateOfBirth">
							Date of Birth
						</label>
						<input
							id="dateOfBirth"
							name="dateOfBirth"
							type="date"
							className={styles.input}
							max={maxDob}
							value={form.dateOfBirth}
							onChange={handleChange}
						/>
					</div>

					<div className={styles.field}>
						<label className={styles.label} htmlFor="bloodGroup">
							Blood Group
						</label>
						<select
							id="bloodGroup"
							name="bloodGroup"
							className={styles.select}
							value={form.bloodGroup}
							onChange={handleChange}
						>
							{BLOOD_GROUPS.map((group) => (
								<option key={group || "none"} value={group}>
									{group || "Select blood group"}
								</option>
							))}
						</select>
					</div>

					<div className={styles.field}>
						<label className={styles.label} htmlFor="allergies-0">
							Allergies
						</label>
						<div className={styles.allergyList}>
							{form.allergies.map((allergyValue, index) => (
								<div className={styles.allergyRow} key={`allergy-${index}`}>
									<input
										id={`allergies-${index}`}
										type="text"
										className={styles.input}
										placeholder="Example: Penicillin"
										value={allergyValue}
										onChange={(event) => handleAllergyChange(index, event.target.value)}
									/>
									<button
										type="button"
										className={styles.removeAllergyButton}
										onClick={() => removeAllergyField(index)}
										disabled={loading}
									>
										Remove
									</button>
								</div>
							))}
						</div>
						<button
							type="button"
							className={styles.addAllergyButton}
							onClick={addAllergyField}
							disabled={loading}
						>
							Add allergy
						</button>
						<p className={styles.hint}>Add each allergy separately for better record accuracy.</p>
					</div>

					{error ? <div className={`${styles.alert} ${styles.alertError}`}>{error}</div> : null}

					<div className={styles.actions}>
						<Button type="submit" loading={loading}>
							Save and go to Dashboard
						</Button>
					</div>
				</form>
			</section>
		</div>
	);
};

export default OnboardingSurvey;
