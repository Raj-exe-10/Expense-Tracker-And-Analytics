# Security Setup Guide

This document provides instructions for securing the Expense Tracker application before deployment.

## Environment Variables

This application uses environment variables to manage sensitive configuration. Never commit `.env` files to version control.

### Initial Setup

1. **Backend Configuration**
   ```bash
   cd backend
   cp .env.example .env
   ```
   Edit the `.env` file and update with your actual values:
   - Generate a secure `SECRET_KEY` for Django
   - Configure database credentials
   - Add email server settings
   - Set up API keys for external services

2. **Frontend Configuration**
   ```bash
   cd frontend
   cp .env.example .env
   ```
   Update the `REACT_APP_API_URL` to point to your backend server.

## Generating a Secure Django Secret Key

To generate a secure secret key for Django:

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Or use this online tool: https://djecrety.ir/

## Security Checklist

Before deploying to production:

### Backend Security
- [ ] Set `DEBUG=False` in production
- [ ] Generate and use a strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Use PostgreSQL or MySQL instead of SQLite
- [ ] Enable HTTPS and set security headers
- [ ] Configure CORS properly (don't use `CORS_ALLOW_ALL_ORIGINS` in production)
- [ ] Set up proper email backend (not console backend)
- [ ] Configure secure session and CSRF cookies
- [ ] Enable security middleware settings

### Frontend Security
- [ ] Update `REACT_APP_API_URL` to use HTTPS
- [ ] Build production bundle with `npm run build`
- [ ] Serve static files securely
- [ ] Implement Content Security Policy (CSP)

### Database Security
- [ ] Use strong database passwords
- [ ] Enable SSL/TLS for database connections
- [ ] Regular database backups
- [ ] Restrict database access to application servers only

### API Security
- [ ] Use API keys for external services
- [ ] Implement rate limiting
- [ ] Use JWT tokens with appropriate expiration
- [ ] Validate and sanitize all user inputs
- [ ] Implement proper authentication and authorization

## Sensitive Files to Never Commit

The following files contain sensitive information and are excluded by `.gitignore`:

- `.env` - Environment variables
- `*.sqlite3` - Database files
- `*.log` - Log files containing sensitive data
- `venv/` - Virtual environment
- `node_modules/` - Node dependencies
- Any files with credentials, keys, or passwords

## External Services Configuration

### Email Configuration (Gmail Example)
1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password: https://myaccount.google.com/apppasswords
3. Use the app password as `EMAIL_HOST_PASSWORD`

### AWS S3 (Optional)
1. Create an IAM user with S3 access
2. Generate access keys
3. Create an S3 bucket for media files
4. Configure CORS on the bucket

### Stripe Payment Gateway (Optional)
1. Sign up for a Stripe account
2. Get your test/live API keys from the dashboard
3. Add webhook endpoints for payment events

## Deployment Security

### Using Environment Variables in Production

#### Heroku
```bash
heroku config:set SECRET_KEY="your-secret-key"
heroku config:set DEBUG=False
```

#### AWS/EC2
Use AWS Systems Manager Parameter Store or Secrets Manager

#### Docker
Use Docker secrets or environment files:
```bash
docker run --env-file .env.production your-app
```

## Monitoring and Logging

### Sentry Integration (Optional)
1. Sign up for Sentry: https://sentry.io
2. Create a new project
3. Add the DSN to your environment variables
4. Errors will be automatically tracked

### Security Headers
The application includes security headers when `DEBUG=False`:
- X-Content-Type-Options
- X-Frame-Options
- Content-Security-Policy
- Strict-Transport-Security

## Regular Security Updates

1. Keep dependencies updated:
   ```bash
   # Backend
   pip list --outdated
   pip install --upgrade package_name
   
   # Frontend
   npm outdated
   npm update
   ```

2. Monitor security advisories:
   - GitHub Dependabot alerts
   - `npm audit` for JavaScript packages
   - `pip-audit` for Python packages

## Reporting Security Issues

If you discover a security vulnerability, please email [your-email@example.com] instead of using the issue tracker.

## Additional Resources

- [Django Security Documentation](https://docs.djangoproject.com/en/stable/topics/security/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [React Security Best Practices](https://reactjs.org/docs/introducing-jsx.html#jsx-prevents-injection-attacks)
