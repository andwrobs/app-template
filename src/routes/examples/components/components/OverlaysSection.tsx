import { InfoIcon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { Pressable } from "react-aria-components";
import { toast } from "sonner";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "~/lib/ui/alert-dialog";
import { Button } from "~/lib/ui/button";
import {
	Command,
	CommandDialog,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
	CommandShortcut,
} from "~/lib/ui/command";
import {
	ContextMenu,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from "~/lib/ui/context-menu";
import {
	Dialog,
	DialogClose,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/lib/ui/dialog";
import {
	DropdownMenu,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/lib/ui/dropdown-menu";
import { FieldLabel } from "~/lib/ui/field";
import { HoverCard, HoverCardTrigger } from "~/lib/ui/hover-card";
import { Input } from "~/lib/ui/input";
import {
	Popover,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from "~/lib/ui/popover";
import {
	Sheet,
	SheetClose,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "~/lib/ui/sheet";
import { TextField } from "~/lib/ui/text-field";
import { Tooltip, TooltipTrigger } from "~/lib/ui/tooltip";
import { Demo, Section } from "./Demo";

export function OverlaysSection() {
	const [commandOpen, setCommandOpen] = useState(false);
	return (
		<Section
			id="overlays"
			title="Overlays and menus"
			description="Modal overlays trap focus and return it to the trigger when they close. Escape closes every overlay; menus move with arrow keys."
		>
			<Demo title="Dialog, alert dialog, and sheet">
				<DialogTrigger>
					<Button variant="outline">Edit profile</Button>
					<Dialog>
						<DialogHeader>
							<DialogTitle>Edit profile</DialogTitle>
							<DialogDescription>
								Changes stay on this page; nothing is saved.
							</DialogDescription>
						</DialogHeader>
						<TextField defaultValue="Sample person" autoFocus>
							<FieldLabel>Name</FieldLabel>
							<Input />
						</TextField>
						<DialogFooter>
							<DialogClose>Cancel</DialogClose>
							<Button slot="close">Save</Button>
						</DialogFooter>
					</Dialog>
				</DialogTrigger>
				<AlertDialogTrigger>
					<Button variant="destructive">Delete sample</Button>
					<AlertDialog>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete the sample?</AlertDialogTitle>
							<AlertDialogDescription>
								This only closes the dialog; nothing is deleted.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								onPress={() => toast.success("Sample deleted (not really).")}
							>
								Delete
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialog>
				</AlertDialogTrigger>
				<SheetTrigger>
					<Button variant="outline">Open sheet</Button>
					<Sheet>
						<SheetHeader>
							<SheetTitle>Filters</SheetTitle>
							<SheetDescription>
								A side panel built on Aria's Modal.
							</SheetDescription>
						</SheetHeader>
						<SheetFooter>
							<SheetClose>Done</SheetClose>
						</SheetFooter>
					</Sheet>
				</SheetTrigger>
			</Demo>
			<Demo title="Popover, tooltip, and hover card">
				<PopoverTrigger>
					<Button variant="outline">Open popover</Button>
					<Popover>
						<PopoverHeader>
							<PopoverTitle>Dimensions</PopoverTitle>
							<PopoverDescription>
								Non-modal; focus moves in and returns on close.
							</PopoverDescription>
						</PopoverHeader>
					</Popover>
				</PopoverTrigger>
				<TooltipTrigger>
					<Button variant="outline" size="icon" aria-label="About tooltips">
						<InfoIcon />
					</Button>
					<Tooltip>Shows on hover and keyboard focus</Tooltip>
				</TooltipTrigger>
				<HoverCardTrigger>
					<Button variant="link">@sample-team</Button>
					<HoverCard>
						A synthetic team profile. Hover cards add detail for pointer users;
						keep the same information reachable another way.
					</HoverCard>
				</HoverCardTrigger>
			</Demo>
			<Demo title="Dropdown menu and context menu">
				<DropdownMenuTrigger>
					<Button variant="outline" aria-label="More actions">
						<MoreHorizontalIcon />
					</Button>
					<DropdownMenu className="w-48">
						<DropdownMenuGroup>
							<DropdownMenuLabel>Sample project</DropdownMenuLabel>
							<DropdownMenuItem onAction={() => toast("Renamed")}>
								Rename
							</DropdownMenuItem>
							<DropdownMenuItem onAction={() => toast("Duplicated")}>
								Duplicate
							</DropdownMenuItem>
						</DropdownMenuGroup>
						<DropdownMenuSeparator />
						<DropdownMenuItem variant="destructive" isDisabled>
							Delete (disabled)
						</DropdownMenuItem>
					</DropdownMenu>
				</DropdownMenuTrigger>
				<ContextMenuTrigger>
					<Pressable>
						<button
							type="button"
							className="flex h-20 w-56 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground"
						>
							Right-click or long-press
						</button>
					</Pressable>
					<ContextMenu>
						<ContextMenuItem onAction={() => toast("Copied")}>
							Copy
						</ContextMenuItem>
						<ContextMenuItem onAction={() => toast("Pasted")}>
							Paste
						</ContextMenuItem>
						<ContextMenuSeparator />
						<ContextMenuItem>Inspect</ContextMenuItem>
					</ContextMenu>
				</ContextMenuTrigger>
			</Demo>
			<Demo title="Command palette and toasts">
				<Button variant="outline" onPress={() => setCommandOpen(true)}>
					Open command palette
				</Button>
				<CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
					<Command>
						<CommandInput placeholder="Type a command…" />
						<CommandList>
							<CommandGroup heading="Suggestions">
								<CommandItem onAction={() => setCommandOpen(false)}>
									New sample
								</CommandItem>
								<CommandItem onAction={() => setCommandOpen(false)}>
									Search tasks
								</CommandItem>
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup heading="Settings">
								<CommandItem
									textValue="Toggle theme"
									onAction={() => setCommandOpen(false)}
								>
									Toggle theme
									<CommandShortcut>⌘T</CommandShortcut>
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</CommandDialog>
				<Button
					variant="outline"
					onPress={() =>
						toast("Sample saved", {
							description: "Toasts announce through a live region.",
							action: { label: "Undo", onClick: () => toast("Undone") },
						})
					}
				>
					Show toast
				</Button>
				<Button
					variant="outline"
					onPress={() => toast.error("The sample server is unavailable.")}
				>
					Error toast
				</Button>
			</Demo>
		</Section>
	);
}
