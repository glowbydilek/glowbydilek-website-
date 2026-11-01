"use client";

import { createContext } from "react";

/** True while the surrounding ActionForm is submitting (read by SubmitButton). */
export const ActionPending = createContext(false);
