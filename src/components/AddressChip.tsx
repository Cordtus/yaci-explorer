import { useState } from 'react'
import { Link } from 'react-router'
import { Copy, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { css, cx } from '@/styled-system/css'

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
		<span className={cx(
			css({
				display: 'inline-flex',
				alignItems: 'center',
				gap: '1',
				px: '2',
				py: '1',
				rounded: 'md',
				bg: 'bg.muted/50',
				fontSize: 'xs',
				fontFamily: 'mono',
				...(link && {
					_hover: { bg: 'bg.muted' },
					transition: 'colors'
				})
			}),
			className
		)}>
			{label && <span className={css({ color: 'fg.muted', mr: '1' })}>{label}:</span>}
			<span className={link ? css({ color: 'colorPalette.default' }) : ''}>{displayAddr}</span>
			<Button
				variant="ghost"
				size="icon"
				className={css({ h: '4', w: '4', ml: '1' })}
				onClick={copyToClipboard}
			>
				{copied ? <CheckCircle className={css({ h: '3', w: '3', color: 'green.500' })} /> : <Copy className={css({ h: '3', w: '3' })} />}
			</Button>
		</span>
	)

	if (link) {
		return (
			<Link to={`/addr/${address}`} className={css({ display: 'inline-block' })}>
				{content}
			</Link>
		)
	}

	return content
}
