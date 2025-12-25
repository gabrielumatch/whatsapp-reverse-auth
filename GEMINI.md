# Project Context: WhatsApp Reverse Auth

## Project Overview
This project implements a "Reverse WhatsApp Auth" system. Instead of the traditional flow where an application sends a code to the user's phone, this system provides an endpoint that generates a unique message/code. The user then sends this message *to* our system (via WhatsApp). We listen for these incoming messages using **Baileys** and authorize the phone number associated with the message.

## Core Flow
1.  **Generation:** An endpoint generates a specific verification message/token for a user session.
2.  **User Action:** The user sends this specific message to our WhatsApp bot number.
3.  **Verification:** The system (using Baileys) listens for incoming messages.
4.  **Authorization:** When the expected message is received, the sender's phone number is authorized/verified.

## Tech Stack
-   **Framework:** Next.js (App Router) - Using latest/v15+ conventions.
-   **Database/Auth (Admins):** Supabase (specifically for admin management/dashboard access).
-   **WhatsApp Integration:** Baileys (to be implemented for listening/replying).
-   **Environment:** Node.js (win32).

## Conventions
-   **Strict Types:** TypeScript for all new code.
-   **App Router:** Use `app/` directory structure.
-   **Architecture:** Separation of concerns between the Next.js frontend/API and the Baileys listener (which might need to run as a separate worker or integrated carefully due to long-running connection nature).

## Interaction Rules for Gemini
-   Focus on the "Reverse Auth" logic.
-   When discussing WhatsApp integration, assume **Baileys** is the library of choice.
-   Recall that "users" in this context are the ones sending messages to be verified, while "admins" log in via Supabase to manage the system.
