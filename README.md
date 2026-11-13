**Welcome to your Base44 project** 

**About**

View and Edit  your app on [Base44.com](http://Base44.com) 

This project contains everything you need to run your app locally.

**Edit the code in your local development environment**

Any change pushed to the repo will also be reflected in the Base44 Builder.

**Prerequisites:** 

1. Clone the repository using the project's Git URL 
2. Navigate to the project directory
3. Install dependencies: `npm install`
4. Create an `.env.local` file and set the right environment variables

```
VITE_BASE44_APP_ID=your_app_id
VITE_BASE44_APP_BASE_URL=your_backend_url

e.g.
VITE_BASE44_APP_ID=cbef744a8545c389ef439ea6
VITE_BASE44_APP_BASE_URL=https://my-to-do-list-81bfaad7.base44.app
```

Run the app: `npm run dev`

**Run it without the live backend**

`npm run dev:mock` starts a local stand-in backend and the app together. It runs
the real backend functions from `base44/functions` against an in-memory
database and a fake Stripe, seeded with clients, creators and bookings at every
stage, so nothing touches the live app or moves money. Restart it (or
`POST /__mock/reset`) to get the seed data back. No `.env.local` is needed.

Sign in with any of these and any password:

- `jordan@example.com`: a client with shoots at every stage
- `maya@example.com`: an approved creator with a full page
- `sam@example.com`: a creator account with no page yet (to try the wizard)
- `priya@example.com`: a creator whose page is in review
- `founder@example.com`: a founder (opens `/admin`)

`npm run test:e2e` clicks through creating, approving and editing a creator
profile in a real browser; it needs `npm run dev:mock` running.

**Design system**

Every screen is built from `src/styles/system.css` and the components in
`src/components/system`. The top of `system.css` lists every class and token.

**Publish your changes**

Open [Base44.com](http://Base44.com) and click on Publish.

**Docs & Support**

Documentation: [https://docs.base44.com/Integrations/Using-GitHub](https://docs.base44.com/Integrations/Using-GitHub)

Support: [https://app.base44.com/support](https://app.base44.com/support)
