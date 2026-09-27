import {
	AlertTriangleIcon,
	ChevronsUpDownIcon,
	FileIcon,
	InfoIcon,
} from "lucide-react";
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "~/lib/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/lib/ui/alert";
import { AspectRatio } from "~/lib/ui/aspect-ratio";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "~/lib/ui/avatar";
import { Badge } from "~/lib/ui/badge";
import { Button } from "~/lib/ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/lib/ui/card";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "~/lib/ui/collapsible";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "~/lib/ui/empty";
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from "~/lib/ui/item";
import { Progress } from "~/lib/ui/progress";
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from "~/lib/ui/resizable";
import { ScrollArea } from "~/lib/ui/scroll-area";
import { Separator } from "~/lib/ui/separator";
import { Skeleton } from "~/lib/ui/skeleton";
import { Spinner } from "~/lib/ui/spinner";
import { Demo, Section } from "./Demo";

const changelog = Array.from(
	{ length: 40 },
	(_, index) => `Sample change ${index + 1}: adjusted a placeholder value`,
);

export function DisplaySection() {
	return (
		<Section
			id="display"
			title="Layout and display"
			description="Containers and status. Long content wraps or scrolls inside its box instead of widening the page."
		>
			<Demo title="Card with long content" className="block">
				<Card>
					<CardHeader>
						<CardTitle>
							A sample card whose title is long enough to wrap
						</CardTitle>
						<CardDescription className="wrap-anywhere">
							Unbroken text wraps too:
							SupercalifragilisticexpialidociousSampleIdentifier_0123456789
						</CardDescription>
						<CardAction>
							<Badge variant="secondary">Draft</Badge>
						</CardAction>
					</CardHeader>
					<CardContent className="text-sm">
						Cards group related content and actions.
					</CardContent>
					<CardFooter className="gap-2">
						<Button size="sm">Open</Button>
						<Button size="sm" variant="ghost">
							Archive
						</Button>
					</CardFooter>
				</Card>
			</Demo>
			<Demo title="Alert" className="grid">
				<Alert>
					<InfoIcon />
					<AlertTitle>Heads up</AlertTitle>
					<AlertDescription>This starter's data is synthetic.</AlertDescription>
				</Alert>
				<Alert variant="destructive">
					<AlertTriangleIcon />
					<AlertTitle>Sync failed</AlertTitle>
					<AlertDescription>The sample server did not answer.</AlertDescription>
				</Alert>
			</Demo>
			<Demo title="Accordion and collapsible" className="grid">
				<Accordion defaultExpandedKeys={["access"]}>
					<AccordionItem id="access">
						<AccordionTrigger>Is it accessible?</AccordionTrigger>
						<AccordionContent>
							Yes. Aria's Disclosure follows the WAI-ARIA pattern.
						</AccordionContent>
					</AccordionItem>
					<AccordionItem id="styled">
						<AccordionTrigger>Is it styled?</AccordionTrigger>
						<AccordionContent>
							With the Nova tokens in index.css.
						</AccordionContent>
					</AccordionItem>
				</Accordion>
				<Collapsible className="space-y-2">
					<CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
						Three sample files
						<ChevronsUpDownIcon aria-hidden className="size-4" />
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-1 text-sm text-muted-foreground">
						<p>notes.md</p>
						<p>tasks.json</p>
						<p>projects.json</p>
					</CollapsibleContent>
				</Collapsible>
			</Demo>
			<Demo title="Avatar, badge, and separator" className="items-center">
				<Avatar>
					<AvatarFallback>SP</AvatarFallback>
				</Avatar>
				<AvatarGroup>
					<Avatar>
						<AvatarFallback>AB</AvatarFallback>
					</Avatar>
					<Avatar>
						<AvatarFallback>CD</AvatarFallback>
					</Avatar>
					<AvatarGroupCount>+3</AvatarGroupCount>
				</AvatarGroup>
				<Separator orientation="vertical" className="h-6" />
				<Badge>Default</Badge>
				<Badge variant="secondary">Secondary</Badge>
				<Badge variant="outline">Outline</Badge>
				<Badge variant="destructive">Destructive</Badge>
			</Demo>
			<Demo title="Loading: skeleton, spinner, and progress" className="grid">
				<div className="flex items-center gap-3">
					<Skeleton className="size-10 rounded-full" />
					<div className="grid flex-1 gap-2">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</div>
				</div>
				<div className="flex items-center gap-2 text-sm">
					<Spinner /> Loading samples
				</div>
				<Progress aria-label="Upload" value={62} />
				<Progress aria-label="Preparing" isIndeterminate />
			</Demo>
			<Demo title="Empty state and item" className="grid">
				<Empty className="border">
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<FileIcon />
						</EmptyMedia>
						<EmptyTitle>No samples yet</EmptyTitle>
						<EmptyDescription>Create one to see it here.</EmptyDescription>
					</EmptyHeader>
					<EmptyContent>
						<Button size="sm">Create sample</Button>
					</EmptyContent>
				</Empty>
				<Item variant="outline">
					<ItemMedia variant="icon">
						<FileIcon />
					</ItemMedia>
					<ItemContent>
						<ItemTitle>tasks.json</ItemTitle>
						<ItemDescription>48 synthetic tasks</ItemDescription>
					</ItemContent>
					<ItemActions>
						<Button size="sm" variant="outline">
							View
						</Button>
					</ItemActions>
				</Item>
			</Demo>
			<Demo title="Aspect ratio, scroll area, and resizable" className="grid">
				<AspectRatio
					ratio={16 / 9}
					className="rounded-lg bg-gradient-to-br from-muted to-accent"
				/>
				<ScrollArea
					className="h-40 rounded-lg border p-3 text-sm"
					tabIndex={0}
					aria-label="Sample changelog"
				>
					<ul className="space-y-1">
						{changelog.map((line) => (
							<li key={line}>{line}</li>
						))}
					</ul>
				</ScrollArea>
				<ResizablePanelGroup
					orientation="horizontal"
					className="min-h-24 rounded-lg border text-sm"
				>
					<ResizablePanel defaultSize={50} className="p-3">
						Drag the handle
					</ResizablePanel>
					<ResizableHandle withHandle />
					<ResizablePanel defaultSize={50} className="p-3">
						or focus it and use arrows
					</ResizablePanel>
				</ResizablePanelGroup>
			</Demo>
		</Section>
	);
}
