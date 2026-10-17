import type * as React from "react";
import { Text } from "#/landing/components/text.tsx";
import { cn } from "#/lib/utils.ts";

interface Props extends React.ComponentProps<typeof Text> {}

/**
 * Centred by default like the rest of the banner — `Text`'s own default is a
 * left alignment, which would leave a wide banner's copy off-axis.
 */
export function CtaBannerDescription({
	align = "center",
	className,
	...props
}: Props) {
	return (
		<Text
			data-slot="cta-banner-description"
			align={align}
			className={cn("mb-8 text-lg text-white/90", className)}
			{...props}
		/>
	);
}
