import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AvatarGroup } from "@/components/ui/avatar-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useCalendar } from "@/components/calendar/contexts/calendar-context";
import { useEffect, useState } from "react";

export function UserSelect() {
	const { users = [], selectedUserId, filterEventsBySelectedUser } = useCalendar();
	// UI-only checkbox state
	const [checkedIds, setCheckedIds] = useState([]);

	// 🔑 Default = ALL checked
	useEffect(() => {
		if (!selectedUserId) {
			setCheckedIds([]);
		}
	}, [selectedUserId]);

	const isAllChecked = checkedIds.length === 0;

	const toggleAll = () => {
		setCheckedIds([]);
		filterEventsBySelectedUser("all");
	};

	const toggleUser = (id) => {
		setCheckedIds((prev) => {
			let next;

			if (prev.includes(id)) {
				next = prev.filter((v) => v !== id);
			} else {
				next = [...prev, id];
			}

			// If nothing selected → ALL
			filterEventsBySelectedUser(
				next.length ? next[next.length - 1] : "all"
			);

			return next;
		});
	};

	return (
		<Popover>
			{/* 🔒 Trigger remains unchanged */}
			<PopoverTrigger asChild>
	<div
		className="w-full inline-flex items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm cursor-pointer"
	>
		<AvatarGroup className="flex items-center" max={3}>
			{users.CALENDAR_USERS.slice(0, 3).map((user) => (
				<Avatar key={user.id} className="size-5 text-xxs">
					<AvatarImage
						src={user.picturePath ?? undefined}
						alt={user.name}
					/>
					<AvatarFallback className="text-xxs">
						{user.name[0]}
					</AvatarFallback>
				</Avatar>
			))}
		</AvatarGroup>

		{/* caret */}
		<svg
			className="ml-2 h-4 w-4 opacity-50"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="6 9 12 15 18 9" />
		</svg>
	</div>
</PopoverTrigger>


<PopoverContent
	side="bottom"
	align="start"
	sideOffset={4}
	avoidCollisions={false}
	portalled={false}
	className="p-2 w-[var(--radix-popover-trigger-width)] md:w-full"
>
				{/* ✅ ALL */}
				<div
					className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-muted rounded-md"
					onClick={toggleAll}
				>
					<Checkbox checked={isAllChecked} />
					<span>All</span>
				</div>

				{/* USERS */}
				{users.CALENDAR_USERS.map((user) => {
					const checked = checkedIds.includes(user.id);

					return (
						<div
							key={user.id}
							className="flex items-center gap-2 px-2 py-2 cursor-pointer hover:bg-muted rounded-md"
							onClick={() => toggleUser(user.id)}
						>
							<Checkbox checked={checked} />

							<Avatar className="size-6">
								<AvatarImage
									src={user.picturePath ?? undefined}
									alt={user.name}
								/>
								<AvatarFallback className="text-xxs">
									{user.name[0]}
								</AvatarFallback>
							</Avatar>

							<p className="truncate">{user.name}</p>
						</div>
					);
				})}
			</PopoverContent>
		</Popover>
	);
}
