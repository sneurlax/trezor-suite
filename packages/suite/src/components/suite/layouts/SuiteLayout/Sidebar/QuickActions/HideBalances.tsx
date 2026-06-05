import { useTranslation } from '@suite/intl';
import { useDiscreetMode } from '@suite-common/discreet-mode';
import { QuickActionButton } from '@trezor/product-components';

export const HideBalances = () => {
    const { translationString } = useTranslation();
    const { isDiscreetMode, setIsDiscreetMode } = useDiscreetMode();
    const translationLabel = isDiscreetMode ? 'TR_SHOW_BALANCES' : 'TR_HIDE_BALANCES';

    return (
        <QuickActionButton
            tooltip={{ content: translationString(translationLabel) }}
            onClick={() => setIsDiscreetMode(!isDiscreetMode)}
            data-testid="@quickActions/hideBalances"
            iconName={isDiscreetMode ? 'eyeSlash' : 'eye'}
        />
    );
};
