I'd keep the config static and pass callbacks from the stepper directly to the active step component.

You don't need to push state setters into the config itself. Think of the config as a component registry, not a dependency-injection mechanism.

### 1. Static step config

```
const steps = [
  { id: "personal", title: "Personal", Component: PersonalStep },
  { id: "address", title: "Address", Component: AddressStep },
  { id: "employment", title: "Employment", Component: EmploymentStep },
] as const;
```

### 2. Parent owns navigation and UI state

```
function Wizard() {
  const [step, setStep] = useState(0);
  const [showErrors, setShowErrors] = useState(false);

  const form = useForm({ /* ... */ });

  const { Component, title } = steps[step];

  const handleNext = () => {
    setShowErrors(false);
    setStep((s) => s + 1);
  };

  const handleInvalid = () => {
    setShowErrors(true);
  };

  return (
    <>
      <h2>{title}</h2>

      <Component
        form={form}
        onNext={handleNext}
        onInvalid={handleInvalid}
      />

      {showErrors && <ValidationSummary />}
    </>
  );
}
```

### 3. Each step wires its FormGroup

```
function PersonalStep({
  form,
  onNext,
  onInvalid,
}: StepProps) {
  return (
    <form.FormGroup
      name="personal"
      onGroupSubmit={onNext}
      onGroupSubmitInvalid={onInvalid}
    >
      {(group) => (
        <>
          <PersonalFields group={group} />

          <button
            type="button"
            onClick={() => group.handleSubmit()}
          >
            Continue
          </button>
        </>
      )}
    </form.FormGroup>
  );
}
```

`StepProps` would use your actual inferred form type, shared across the step components. For the final step, the valid-submit callback should submit the parent form rather than advance again.

These are the actual v1 group submission callbacks supported by TanStack Form.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://tanstack.com\&sz=32)

TanStack Form React Docs



### What about repeating the FormGroup callbacks?

That's the tradeoff. You're still repeating:

```
onGroupSubmit={onNext}
onGroupSubmitInvalid={onInvalid}
```

But that's two simple props, not repeated conditional rendering and step navigation logic.

You could abstract this into a generic `WizardFormGroup` that binds the callbacks centrally, but I'd be cautious. TanStack's generic types around group field paths and validators can become awkward when you dynamically construct group names.

What I'd recommend for your architecture:

- Stepper: navigation, validation-summary visibility, shared form instance.
- Config: step metadata and component references.
- Step components: group name, group-specific validators, fields, submission wiring.
- Shared `StepProps`: `form`, `onNext`, `onInvalid`, and optionally `onBack`.

That keeps the configuration declarative while preserving TanStack's strong type inference through literal group names.

I wouldn't create a generic wizard abstraction just to eliminate two props.