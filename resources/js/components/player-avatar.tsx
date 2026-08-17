import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type PlayerAvatarProps = {
    name?: string | null;
    image?: string | null;
};

export function PlayerAvatar({ name, image }: PlayerAvatarProps) {
    const fallback = (name ?? 'CP')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');

    return (
        <Avatar>
            {image && <AvatarImage src={image} alt={name ?? 'CourtPrime player'} />}
            <AvatarFallback>{fallback || 'CP'}</AvatarFallback>
        </Avatar>
    );
}
