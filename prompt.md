Set up this project with the official Anthropic Claude Code skills repository:

[git@github.com](mailto:git@github.com):anthropics/skills.git

Goals:

1. Improve frontend/UI/UX quality.
2. Add strong security review rules for the entire system.
3. Keep Claude token/context usage efficient.
4. Do NOT enable or load unnecessary skills globally.

First, inspect the official Anthropic skills repository and determine which available skills are relevant to:

* frontend design
* UI/UX
* web application development
* testing
* security
* code review

Install/use only the relevant skills.

For frontend development, prioritize:

* frontend-design
* React best practices
* Tailwind CSS
* shadcn/ui
* responsive design
* accessibility
* production-quality UI
* web application testing

Also create a project-level custom skill called:

security-review

The security-review skill must be automatically considered whenever creating or modifying:

* authentication
* authorization
* user roles and permissions
* APIs
* controllers
* middleware
* routes
* database queries
* file uploads
* payment-related code
* login/register/reset-password functionality
* admin functionality
* public forms
* webhooks
* third-party integrations
* sensitive configuration

The security skill must check for at least:

## Authentication Security

* Secure authentication implementation
* Password hashing
* Password reset security
* Login throttling/rate limiting
* Brute-force protection
* Session security
* Session fixation
* Secure logout
* Remember-me token security
* Account enumeration
* Email verification where appropriate

## Authorization

Never trust frontend permission checks.

Every protected operation must enforce authorization on the server.

Check:

* RBAC
* policies
* gates
* middleware
* tenant ownership
* branch ownership
* organization ownership
* resource ownership
* IDOR vulnerabilities
* privilege escalation

A user must never gain access simply by changing:

* IDs
* URLs
* request parameters
* branch_id
* organization_id
* tenant_id
* user_id

## Multi-Tenant Security

This project may support multiple businesses, organizations, branches, or tenants.

Prevent data leakage between tenants.

Every tenant-owned database operation must verify the authenticated user's tenant/organization.

Never rely only on IDs supplied by the frontend.

Example:

BAD:
Model::find($request->id)

GOOD:
Query through the authenticated user's organization/tenant and verify authorization.

Protect against:

* cross-tenant data access
* cross-branch access
* tenant ID manipulation
* organization ID manipulation

## API Security

Check APIs for:

* authentication
* authorization
* rate limiting
* input validation
* mass assignment
* excessive data exposure
* insecure direct object references
* unsafe HTTP methods
* enumeration attacks
* replay attacks where relevant
* sensitive error responses

Return only fields required by the client.

Never expose:

* passwords
* password hashes
* secrets
* API keys
* internal tokens
* unnecessary personal information

## Laravel Security

For Laravel projects check:

* CSRF protection
* FormRequest validation
* policies/gates
* authentication middleware
* authorization middleware
* route protection
* Eloquent mass assignment
* $fillable / $guarded
* raw SQL usage
* SQL injection
* XSS
* Blade escaping
* signed URLs where appropriate
* Laravel Sanctum security
* session configuration
* cookie configuration
* production error handling
* APP_DEBUG=false in production

Avoid raw SQL unless necessary.

Never concatenate user input into SQL.

## React Security

Check:

* dangerouslySetInnerHTML
* unsafe HTML rendering
* localStorage usage for sensitive information
* authentication tokens
* API responses
* frontend-only authorization
* exposed secrets
* environment variables
* URL parameters
* user-generated content

Never put secrets into:

VITE_*
NEXT_PUBLIC_*
or any client-accessible environment variable.

## Input Validation

Treat ALL client input as untrusted.

Validate:

* strings
* IDs
* numbers
* dates
* files
* images
* URLs
* emails
* phone numbers
* enum values
* pagination
* sorting
* filtering

Never trust validation performed only in React.

Server-side validation is mandatory.

## File Upload Security

Check:

* MIME type
* file extension
* actual file type
* maximum size
* filename sanitization
* randomized filenames
* directory traversal
* executable files
* SVG risks
* public/private storage
* authorization for downloads

Uploaded files must never be able to execute server-side code.

## OWASP

Review code against the current OWASP Web Application Security risks including:

* Broken Access Control
* Injection
* Authentication failures
* Cryptographic failures
* Security misconfiguration
* vulnerable dependencies
* integrity failures
* logging/monitoring failures
* SSRF
* XSS
* CSRF
* IDOR

## Secrets

Never hardcode:

* passwords
* database credentials
* API keys
* SMTP credentials
* payment keys
* JWT secrets
* OAuth secrets
* access tokens

Use environment variables.

Never print secrets in:

* console logs
* Laravel logs
* browser console
* API responses
* Git commits

Check .gitignore before committing anything sensitive.

## Database Security

Check for:

* SQL injection
* mass assignment
* insecure queries
* missing authorization scopes
* tenant isolation
* unnecessary sensitive data
* exposed soft-deleted records
* insecure cascading deletes

Use database transactions for critical multi-step operations.

## Financial/POS Operations

For POS, billing, inventory, payments, or financial modules:

Never trust prices, totals, discounts, tax, commissions, balances, or payment amounts calculated by the frontend.

Recalculate authoritative values on the server.

Protect against:

* price manipulation
* negative quantities
* discount manipulation
* duplicate payments
* replayed requests
* unauthorized refunds
* inventory manipulation
* race conditions

Use database transactions when necessary.

## Audit Logging

Important actions should have audit trails including:

* login
* failed login
* role changes
* permission changes
* user creation/deletion
* financial adjustments
* refunds
* inventory adjustments
* security configuration changes
* admin actions

Never store sensitive secrets inside audit logs.

## Rate Limiting

Apply appropriate throttling to:

* login
* password reset
* OTP
* registration
* public APIs
* search endpoints vulnerable to scraping
* verification endpoints
* public forms

## Error Handling

Production responses must not expose:

* stack traces
* SQL queries
* database schema
* server filesystem paths
* environment variables
* framework debugging information
* secrets

Provide safe user-facing error messages.

## Dependency Security

When installing packages:

1. Prefer maintained and widely used packages.
2. Avoid unnecessary dependencies.
3. Check for known security vulnerabilities.
4. Do not install random packages just to solve trivial problems.
5. Never execute unknown install scripts without inspection.

## Security Review Workflow

Whenever significant functionality is implemented:

1. Implement the feature.
2. Review authentication.
3. Review authorization.
4. Review validation.
5. Review tenant isolation.
6. Review database queries.
7. Review API exposure.
8. Review frontend security.
9. Review possible abuse cases.
10. Fix vulnerabilities before considering the feature complete.

For sensitive modules perform an adversarial review:

"How could an authenticated malicious user abuse this?"

Also consider:

"How could an unauthenticated attacker abuse this?"

Then fix realistic attack paths.

## UI Skill

Use the official frontend-design skill when designing interfaces.

The target UI stack is generally:

* React
* shadcn/ui
* Tailwind CSS
* Lucide React

UI requirements:

* premium SaaS appearance
* responsive desktop/tablet/mobile
* strong visual hierarchy
* consistent spacing
* accessible components
* good loading states
* good empty states
* good error states
* skeleton loaders where appropriate
* confirmation dialogs for destructive actions
* no generic AI-looking dashboard
* reusable components
* avoid unnecessary gradients
* avoid excessive cards
* polished tables
* polished forms
* mobile-friendly navigation

Do NOT change business logic merely to improve appearance.

## Token Efficiency

Do NOT load every Anthropic skill into every request.

Use progressive skill loading.

Only invoke frontend-design when doing UI/frontend work.

Only invoke security-review when security is relevant or when performing a security audit.

Keep project skills focused and modular.

Do not duplicate massive documentation inside multiple skills.

## Final setup

After configuration, show me:

1. Which Anthropic skills were installed/enabled.
2. Which skills were skipped.
3. Location of each installed skill.
4. The custom security-review skill that was created.
5. Any project CLAUDE.md changes.
6. Whether any skills overlap unnecessarily.
7. Recommendations for reducing token/context usage.

Do not modify application functionality during this setup unless required for securely configuring the skills.
