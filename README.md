# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/e0150df3-7ffe-4c14-8cf5-4bd0556db551

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/e0150df3-7ffe-4c14-8cf5-4bd0556db551) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/e0150df3-7ffe-4c14-8cf5-4bd0556db551) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

// ...existing code...
+WebSocket server (dev)
+
+1. Instale dependências (se ainda não):
+```
+npm install ws @supabase/supabase-js
+npm i -D ts-node
+```
+
+2. Rodar diretamente o arquivo TypeScript (PowerShell):
+```
+$env:START_WS_ON_RUN='1'; $env:WS_PORT='3001'; npx ts-node -T supabase/functions/esp32-events/index.ts
+```
+
+ou (cross-platform):
+```
+npx cross-env START_WS_ON_RUN=1 WS_PORT=3001 npx ts-node -T supabase/functions/esp32-events/index.ts
+```
+
+O servidor WebSocket ficará escutando em ws://localhost:3001 e irá inserir eventos na tabela `events` do Supabase configurado nas suas variáveis de ambiente.
