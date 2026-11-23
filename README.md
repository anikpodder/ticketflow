# TicketFlow

**An Event Ticket Booking Platform**

TicketFlow is a full-stack event ticket booking application where organizers can create and manage events, and customers can browse events, temporarily reserve seats, make mock payments, and receive booking notifications.

## Live Application

- **Frontend:** https://ticketflow-puce.vercel.app/
- **Backend API:** https://ticketflow-puce.vercel.app/api/public/events
- **GitHub:** https://github.com/anikpodder/ticketflow

## Technology Stack

| Category | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Authentication | Clerk |
| Validation | Zod |
| Payments | Mock Stripe and Mock PayPal |
| Hosting | Vercel |
| Database Hosting | Neon |

## Features

- Authentication and role-based access control (Customer, Organizer, Admin).
- Event creation and management.
- Public event browsing and searching.
- Seat selection and temporary seat reservation.
- Five-minute seat hold mechanism.
- Mock Stripe and PayPal payment providers.
- Booking confirmation and payment history.
- Idempotent payment processing.
- Double-booking prevention using database transactions and conditional updates.
- Booking cancellation and refund handling.
- In-app notifications and console-based email notification abstraction.

## Getting Started

### Prerequisites

- Node.js
- npm
- PostgreSQL database
- Clerk account

### Installation

```bash
git clone https://github.com/anikpodder/ticketflow.git
cd ticketflow
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="your_pooled_database_url"
DIRECT_URL="your_direct_database_url"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"

NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL="/"
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL="/"
```

Use your own credentials. Never commit `.env` files.

### Database Setup

```bash
npx prisma generate
npx prisma migrate deploy
```

### Run Development Server

```bash
npm run dev
```

Open http://localhost:3000.

### Build

```bash
npm run build
```

## Demo Accounts

The application has separate Customer and Organizer demo accounts.

- Customer: Credentials provided through the project submission form.
- Organizer: Credentials provided through the project submission form.

For security, demo passwords are not published in this public repository.

## CI/CD Status

GitHub Actions CI workflow: Not configured in the current repository.

Vercel deployment is connected to GitHub for application deployment.

## Project Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AI_USAGE.md](./AI_USAGE.md)

## Author

**Anik Podder**

GitHub: https://github.com/anikpodder
