import {
	ArrowRightIcon,
	BoldIcon,
	ItalicIcon,
	SearchIcon,
	UnderlineIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "~/lib/ui/button";
import { ButtonGroup, ButtonGroupSeparator } from "~/lib/ui/button-group";
import { FieldDescription, FieldError, FieldLabel } from "~/lib/ui/field";
import { Input } from "~/lib/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "~/lib/ui/input-group";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "~/lib/ui/input-otp";
import { Kbd, KbdGroup } from "~/lib/ui/kbd";
import { Label } from "~/lib/ui/label";
import { Spinner } from "~/lib/ui/spinner";
import { TextField } from "~/lib/ui/text-field";
import { Textarea } from "~/lib/ui/textarea";
import { Toggle } from "~/lib/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "~/lib/ui/toggle-group";
import { Demo, Section } from "./Demo";
import { usePendingDemo } from "./usePendingDemo";

export function InputsSection() {
	const { isPending, simulateSave } = usePendingDemo();
	const [username, setUsername] = useState("ab");
	const usernameError =
		username.trim().length < 3 ? "Use at least 3 characters." : undefined;

	return (
		<Section
			id="inputs"
			title="Inputs and fields"
			description="Buttons, text entry, and field composition. Labels, descriptions, and errors sit inside the Aria field so they are linked to the control."
		>
			<Demo title="Button">
				<Button>Default</Button>
				<Button variant="secondary">Secondary</Button>
				<Button variant="outline">Outline</Button>
				<Button variant="ghost">Ghost</Button>
				<Button variant="destructive">Destructive</Button>
				<Button variant="link">Link</Button>
				<Button size="icon" aria-label="Next">
					<ArrowRightIcon />
				</Button>
				<Button isDisabled>Disabled</Button>
				<Button isPending={isPending} onPress={simulateSave}>
					{isPending && <Spinner data-icon="inline-start" />}
					{isPending ? "Saving" : "Pending state"}
				</Button>
			</Demo>
			<Demo title="Button group, toggle, and toggle group">
				<ButtonGroup aria-label="History">
					<Button variant="outline">Undo</Button>
					<ButtonGroupSeparator />
					<Button variant="outline">Redo</Button>
				</ButtonGroup>
				<Toggle aria-label="Bold">
					<BoldIcon />
				</Toggle>
				<ToggleGroup
					aria-label="Text style"
					selectionMode="multiple"
					variant="outline"
				>
					<ToggleGroupItem id="bold" aria-label="Bold">
						<BoldIcon />
					</ToggleGroupItem>
					<ToggleGroupItem id="italic" aria-label="Italic">
						<ItalicIcon />
					</ToggleGroupItem>
					<ToggleGroupItem id="underline" aria-label="Underline">
						<UnderlineIcon />
					</ToggleGroupItem>
				</ToggleGroup>
			</Demo>
			<Demo title="Text field, validation, and disabled" className="grid">
				<TextField
					value={username}
					onChange={setUsername}
					isInvalid={Boolean(usernameError)}
					validationBehavior="aria"
				>
					<FieldLabel>Username</FieldLabel>
					<Input />
					<FieldDescription>Type a third character to fix it.</FieldDescription>
					<FieldError>{usernameError}</FieldError>
				</TextField>
				<TextField isDisabled defaultValue="Read-only sample">
					<FieldLabel>Disabled</FieldLabel>
					<Input />
				</TextField>
			</Demo>
			<Demo title="Input group and keyboard hint" className="grid">
				<Label htmlFor="docs-search">Search the docs</Label>
				<InputGroup>
					<InputGroupAddon>
						<SearchIcon aria-hidden />
					</InputGroupAddon>
					<InputGroupInput id="docs-search" placeholder="Search…" />
					<InputGroupAddon align="inline-end">
						<KbdGroup>
							<Kbd>⌘</Kbd>
							<Kbd>K</Kbd>
						</KbdGroup>
					</InputGroupAddon>
				</InputGroup>
			</Demo>
			<Demo title="Textarea" className="grid">
				<TextField>
					<FieldLabel>Message</FieldLabel>
					<Textarea placeholder="Grows with its content." />
				</TextField>
			</Demo>
			<Demo title="One-time code" className="grid">
				<Label htmlFor="otp">Verification code</Label>
				<InputOTP id="otp" maxLength={6}>
					<InputOTPGroup>
						<InputOTPSlot index={0} />
						<InputOTPSlot index={1} />
						<InputOTPSlot index={2} />
					</InputOTPGroup>
					<InputOTPSeparator />
					<InputOTPGroup>
						<InputOTPSlot index={3} />
						<InputOTPSlot index={4} />
						<InputOTPSlot index={5} />
					</InputOTPGroup>
				</InputOTP>
			</Demo>
		</Section>
	);
}
