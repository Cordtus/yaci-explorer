import { useState } from 'react'
import { Link } from 'react-router'
import { Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AddressChipProps {
	address: string
	label?: string
	truncate?: boolean
	link?: boolean
	className?: string
}

export function AddressChip({ address, label, truncate = true, link = true, className }: AddressChipProps) {
	const [copied, setCopied] = useState(false)

	const copyToClipboard = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		navigator.clipboard.writeText(address)
		setCopied(true)
		setTimeout(() => setCopied(false), 2000)
	}

	const displayAddr = truncate && address.length > 20
		? `${address.slice(0, 10)}...${address.slice(-8)}`
		: address

	const content = (
		<span className={cn(
			"inline-flex items-center gap-1 px-2 py-1 rounded bg-muted/50 text-xs font-mono",
			link && "hover:bg-muted transition-colors",
			className
		)}>
			{label && <span className="text-muted-foreground mr-1">{label}:</span>}
			<span className={link ? "text-primary" : ""}>{displayAddr}</span>
			<Button
				variant="ghost"
				size="icon"
				className="h-4 w-4 ml-1"
				onClick={copyToClipboard}
			>
				{copied ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
			</Button>
		</span>
	)

	if (link) {
		return (
			<Link to={`/address/${address}`} className="inline-block">
				{content}
			</Link>
		)
	}

	return content
}
