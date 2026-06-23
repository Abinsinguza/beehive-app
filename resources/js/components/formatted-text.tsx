import { formatDisplayText } from '@/lib/utils';

function FormattedText({ text }: { text: string | number | null | undefined }) {
    return <>{formatDisplayText(text)}</>;
}

export default FormattedText;