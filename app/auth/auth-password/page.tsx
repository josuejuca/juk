import Link from "next/link";
import type { Metadata } from "next";

import styles from "../login/styles.module.css";

export const metadata: Metadata = {
	title: "Trocar senha",
};

export default function AuthPasswordIndexPage() {
	return (
		<main className={styles.page}>
			<div className={styles.bg} aria-hidden="true" />

			<section className={styles.card} role="region" aria-label="Link inválido">
				<h1 className={styles.title}>Link inválido</h1>
				<p className={styles.subtle}>
					Abra o link completo enviado para você (com a key).
				</p>

				<div className={`${styles.row} ${styles.rowSpaced}`}>
					<span className={styles.subtle}>Precisa gerar um novo?</span>
					<Link className={styles.link} href="/auth/forgot-password">
						Recuperar senha
					</Link>
				</div>
			</section>
		</main>
	);
}
