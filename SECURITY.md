# Security Policy

## ⚠️ Project Notice

This is a **DevSecOps educational demo project**. It contains **intentional security vulnerabilities** (SQL Injection, Reflected XSS) for the explicit purpose of demonstrating how automated security scanning tools (SonarCloud, pip-audit, Trivy) detect and block insecure code in a CI/CD pipeline.

**DO NOT deploy this application in a production environment.**

---

## Supported Versions

This project is maintained at version `1.0` for demonstration purposes.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

---

## Intentional Vulnerabilities (By Design)

The following vulnerabilities exist **intentionally** and are part of the demo:

| Vulnerability | Location | Purpose |
|---------------|----------|---------|
| SQL Injection | `/login`, `/product` routes in `app.py` | Detected by SonarCloud SAST |
| Reflected XSS | `/search` route in `app.py` | Detected by SonarCloud SAST |

---

## Reporting a Vulnerability

If you discover an **unintentional** vulnerability in this project (outside the scope of the demo flaws listed above), please report it by opening a GitHub Issue with the label `security`.

- **Response time**: Within 48 hours
- **Expected outcome**: Issue will be reviewed, acknowledged, and patched in the next release if valid

---

## Security Pipeline

This project uses the following automated security tools integrated into its CI/CD pipeline:

- **SonarCloud** — Static Application Security Testing (SAST)
- **pip-audit** — Software Composition Analysis (SCA)
- **Trivy** — Container image vulnerability scanning
