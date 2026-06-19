# Onboarding Feature Refactor — Design Spec
_2026-06-19_

## Goal

Reorganise `src/features/onboarding/` into clean sub-directories. Replace ad-hoc `useState(loading)` + try/finally patterns with `useMutation`/`useQuery` hooks. Steps become pure JSX shells.

## Directory Structure (target)

```
onboarding/
  actions/                       ← server actions (unchanged)
  constants/
    steps.ts                     ← STEP_ORDER array + STEP_IDS const
  hooks/
    use-create-agent.ts
    use-delete-agent.ts
    use-agent-status.ts          ← useQuery, 3s poll
    use-create-org.ts
    use-create-project.ts
    use-update-account.ts
    use-add-notifier.ts
    use-remove-notifier.ts
    use-add-storage.ts
    use-remove-storage.ts
    use-generate-edge-key.ts
    use-mark-onboarding-done.ts
  schemas/
    account.schema.ts            ← BaseSchema + WithPasswordSchema
  types/
    index.ts                     ← content of onboarding.types.ts (moved)
  utils/                         ← reserved, empty for now
  steps/                         ← existing components, thinned to JSX
  onboarding-checklist.tsx
  onboarding-shell.tsx
  onboarding-state.ts
  onboarding-stepper.tsx
  onboarding-steps.tsx
  is-onboarding-done.ts
  onboarding.types.ts            ← deleted once types/index.ts takes over
```

## Hook Contract

Every hook calls `useOnboarding()` internally. Steps pass nothing — they only import the hook.

**Mutation hooks** return `UseMutationResult` directly so steps get `mutate`, `isPending`, `isError` etc. from TanStack Query natively.

```ts
// Pattern
export const useCreateAgent = () => {
  const { state, updateContext } = useOnboarding();
  return useMutation({
    mutationFn: async (name: string) => {
      const orgId = (state?.context.flowData.org as any)?.id;
      if (!orgId) throw new Error("Missing org ID");
      const result = await createAgentAction({ organizationId: orgId, data: { name, description: "" } });
      if (!result?.data?.data) throw new Error(result?.serverError ?? "Failed to create agent");
      const newAgent: OnboardingAgent = { id: result.data.data.id, name: result.data.data.name };
      const agents = [...((state?.context.flowData.agents ?? []) as OnboardingAgent[]), newAgent];
      await updateContext({ flowData: { ...state?.context.flowData, agents } });
      return newAgent;
    },
    onError: (err: Error) => toast.error(err.message),
  });
};
```

**Query hooks** return `UseQueryResult`:

```ts
export const useAgentStatus = () => {
  const { state } = useOnboarding();
  const agentId = (state?.context.flowData.agents as OnboardingAgent[])?.[0]?.id;
  return useQuery({
    queryKey: ["onboarding-agent-status", agentId],
    queryFn: async () => { /* getAgentStatusAction */ },
    refetchInterval: 3_000,
    enabled: !!agentId,
  });
};
```

## Constants

`constants/steps.ts` exports:
- `STEP_ORDER: string[]` — the full ordered list used by the shell for Back/Next logic
- `STEP_IDS` — typed const object `{ LOGIN: "login", ... }` for safe step references

## Schemas

`schemas/account.schema.ts` exports `BaseSchema` and `WithPasswordSchema` (currently inline in `step-account-info.tsx`).

## Types

`types/index.ts` is a verbatim move of `onboarding.types.ts`. All existing imports updated from `@/features/onboarding/onboarding.types` → `@/features/onboarding/types`.

## Steps After Refactor

Each step file shrinks to: imports + JSX + hook call. No direct action imports, no manual loading state.

Example diff for `step-agent-create.tsx`:
- Remove: `createAgentAction`, `deleteAgentAction`, `useState(adding)`, manual try/finally
- Add: `useCreateAgent()`, `useDeleteAgent()`

## Out of Scope

- `onboarding-state.ts` server logic — untouched
- `onboarding-steps.tsx` step registry — untouched
- UI/UX changes to any step
- Adding new steps
