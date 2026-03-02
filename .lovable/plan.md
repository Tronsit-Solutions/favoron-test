

## Fix: Welcome email says "EE.UU." instead of global

The welcome email template A in `supabase/functions/send-welcome-email/index.ts` says "conectar a quienes viajan desde EE.UU." but travelers come from anywhere in the world.

### Change

In `getEmailTemplateA`, update the copy from:

> "conectar a quienes viajan desde EE.UU. con quienes buscan recibir productos allá en Guatemala"

to:

> "conectar a quienes viajan desde cualquier parte del mundo con quienes buscan recibir productos en Guatemala"

Single line change in `supabase/functions/send-welcome-email/index.ts`.

