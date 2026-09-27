import { useState } from "react";
import { Checkbox, CheckboxButton, CheckboxField } from "~/lib/ui/checkbox";
import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "~/lib/ui/combobox";
import { FieldDescription, FieldLabel, fieldVariants } from "~/lib/ui/field";
import { Label } from "~/lib/ui/label";
import { NativeSelect, NativeSelectOption } from "~/lib/ui/native-select";
import { RadioGroup, RadioGroupItem } from "~/lib/ui/radio-group";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/lib/ui/select";
import { Slider } from "~/lib/ui/slider";
import { Switch } from "~/lib/ui/switch";
import { Demo, Section } from "./Demo";

const fruits = ["Apple", "Banana", "Blueberry", "Cherry", "Grape", "Mango"];

export function SelectionSection() {
	const [volume, setVolume] = useState(40);
	return (
		<Section
			id="selection"
			title="Selection"
			description="Choices from a set. Every control works with Tab, arrows, Space, and Enter, and shows a focus ring only for keyboard focus."
		>
			<Demo title="Checkbox" className="grid">
				<CheckboxField defaultSelected>
					<CheckboxButton>Email me about sample releases</CheckboxButton>
					<FieldDescription>A linked description.</FieldDescription>
				</CheckboxField>
				<div className="flex items-center gap-2">
					<Checkbox id="mixed" isIndeterminate />
					<Label htmlFor="mixed">Indeterminate</Label>
				</div>
				<CheckboxField isDisabled>
					<CheckboxButton>Disabled</CheckboxButton>
				</CheckboxField>
			</Demo>
			<Demo title="Radio group" className="grid">
				<RadioGroup defaultValue="comfortable" className="grid gap-3">
					<Label>Density</Label>
					{["default", "comfortable", "compact"].map((value) => (
						<div key={value} className="flex items-center gap-2">
							<RadioGroupItem value={value} id={`density-${value}`} />
							<Label htmlFor={`density-${value}`} className="capitalize">
								{value}
							</Label>
						</div>
					))}
				</RadioGroup>
			</Demo>
			<Demo title="Switch and slider" className="grid">
				<div className="flex items-center gap-2">
					<Switch id="airplane" />
					<Label htmlFor="airplane">Airplane mode</Label>
				</div>
				<div className="flex items-center gap-2">
					<Switch id="locked" isDisabled defaultSelected />
					<Label htmlFor="locked">Disabled</Label>
				</div>
				<div className="grid gap-2">
					<div className="flex justify-between text-sm">
						<span id="volume-label" className="font-medium">
							Volume
						</span>
						<span className="text-muted-foreground tabular-nums">
							{volume}%
						</span>
					</div>
					<Slider
						aria-labelledby="volume-label"
						value={volume}
						onChange={(value) => setVolume(value as number)}
					/>
				</div>
			</Demo>
			<Demo title="Select and native select" className="grid">
				<Select
					placeholder="Choose a fruit"
					className={fieldVariants({ orientation: "vertical" })}
				>
					<FieldLabel>Fruit</FieldLabel>
					<SelectTrigger>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{fruits.map((fruit) => (
							<SelectItem key={fruit} id={fruit}>
								{fruit}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<div className="grid gap-2">
					<Label htmlFor="native-size">Size (native)</Label>
					<NativeSelect id="native-size" defaultValue="m">
						<NativeSelectOption value="s">Small</NativeSelectOption>
						<NativeSelectOption value="m">Medium</NativeSelectOption>
						<NativeSelectOption value="l">Large</NativeSelectOption>
					</NativeSelect>
				</div>
			</Demo>
			<Demo title="Combobox" className="grid">
				<Combobox
					allowsEmptyCollection
					className={fieldVariants({ orientation: "vertical" })}
				>
					<FieldLabel>Favorite fruit</FieldLabel>
					<ComboboxInput placeholder="Type to filter" />
					<ComboboxContent>
						<ComboboxList
							renderEmptyState={() => (
								<ComboboxEmpty>No fruit matches.</ComboboxEmpty>
							)}
						>
							{fruits.map((fruit) => (
								<ComboboxItem key={fruit} id={fruit}>
									{fruit}
								</ComboboxItem>
							))}
						</ComboboxList>
					</ComboboxContent>
				</Combobox>
			</Demo>
		</Section>
	);
}
