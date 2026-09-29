import { useState } from "react";
import type { DateValue } from "react-aria-components";
import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { Calendar, RangeCalendar } from "~/lib/ui/calendar";
import { Card, CardContent } from "~/lib/ui/card";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "~/lib/ui/carousel";
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "~/lib/ui/chart";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/lib/ui/table";
import { Demo, Section } from "./Demo";

const visits = [
	{ month: "Jan", desktop: 186, mobile: 80 },
	{ month: "Feb", desktop: 305, mobile: 200 },
	{ month: "Mar", desktop: 237, mobile: 120 },
	{ month: "Apr", desktop: 73, mobile: 190 },
	{ month: "May", desktop: 209, mobile: 130 },
	{ month: "Jun", desktop: 214, mobile: 140 },
];

const chartConfig = {
	desktop: { label: "Desktop", color: "var(--chart-2)" },
	mobile: { label: "Mobile", color: "var(--chart-4)" },
} satisfies ChartConfig;

const invoices = [
	{ id: "INV-001", status: "Paid", amount: "$250.00" },
	{ id: "INV-002", status: "Pending", amount: "$150.00" },
	{ id: "INV-003", status: "Unpaid", amount: "$350.00" },
];

export function CollectionsSection() {
	const [picked, setPicked] = useState<DateValue>();
	return (
		<Section
			id="collections"
			title="Collections and dates"
			description="Calendars and tables move with arrow keys. The chart has a caption, and its tooltips follow the arrow keys once it has focus."
		>
			<Demo title="Calendar and range calendar">
				<div className="space-y-2">
					<Calendar
						aria-label="Sample date"
						className="rounded-lg border"
						onChange={setPicked}
					/>
					<p className="text-sm text-muted-foreground" aria-live="polite">
						{picked ? `Picked ${picked.toString()}` : "Pick a date"}
					</p>
				</div>
				<RangeCalendar aria-label="Sample stay" className="rounded-lg border" />
			</Demo>
			<Demo title="Carousel" className="block px-12">
				<Carousel aria-label="Sample slides" className="w-full max-w-xs">
					<CarouselContent>
						{[1, 2, 3, 4, 5].map((slide) => (
							<CarouselItem key={slide}>
								<Card>
									<CardContent className="flex aspect-square items-center justify-center text-4xl font-semibold">
										{slide}
									</CardContent>
								</Card>
							</CarouselItem>
						))}
					</CarouselContent>
					<CarouselPrevious />
					<CarouselNext />
				</Carousel>
			</Demo>
			<Demo title="Chart" className="block">
				<figure className="space-y-2">
					<figcaption className="text-sm text-muted-foreground">
						Sample visits by month, desktop and mobile
					</figcaption>
					<ChartContainer config={chartConfig} className="min-h-48 w-full">
						<BarChart accessibilityLayer data={visits}>
							<CartesianGrid vertical={false} />
							<XAxis dataKey="month" tickLine={false} axisLine={false} />
							<ChartTooltip content={<ChartTooltipContent />} />
							<Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
							<Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
						</BarChart>
					</ChartContainer>
				</figure>
			</Demo>
			<Demo title="Table" className="block">
				<Table aria-label="Sample invoices">
					<TableHeader>
						<TableHead isRowHeader>Invoice</TableHead>
						<TableHead>Status</TableHead>
						<TableHead className="text-right">Amount</TableHead>
					</TableHeader>
					<TableBody>
						{invoices.map((invoice) => (
							<TableRow key={invoice.id} id={invoice.id}>
								<TableCell className="font-medium">{invoice.id}</TableCell>
								<TableCell>{invoice.status}</TableCell>
								<TableCell className="text-right">{invoice.amount}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Demo>
		</Section>
	);
}
