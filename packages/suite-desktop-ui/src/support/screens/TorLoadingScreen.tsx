import { selectModalType } from '@suite/modal';
import { TorLoader } from '@suite/tor';

import { toggleTor } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { ThemeProvider } from 'src/support/suite/ThemeProvider';
import { useTor } from 'src/support/suite/useTor';

type TorLoadingScreenProps = {
    callback: (value?: unknown) => void;
};

export const TorLoadingScreen = ({ callback }: TorLoadingScreenProps) => {
    useTor();
    const modalType = useSelector(selectModalType);
    const dispatch = useDispatch();

    const handleToggleTor = (shouldEnable: boolean) => dispatch(toggleTor(shouldEnable, modalType));

    return (
        <ThemeProvider>
            <div data-testid="@tor-loading-screen">
                <TorLoader callback={callback} onToggleTor={handleToggleTor} />
            </div>
        </ThemeProvider>
    );
};
