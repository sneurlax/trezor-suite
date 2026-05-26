import { selectModalType } from '@suite/modal';
import { TorLoader } from '@suite/tor';
import { type UserContextPayload } from '@suite-common/suite-types';

import { toggleTor } from 'src/actions/suite/suiteActions';
import { useDispatch, useSelector } from 'src/hooks/suite';

type TorLoadingModalProps = Omit<Extract<UserContextPayload, { type: 'tor-loading' }>, 'type'> & {
    onCancel: () => void;
};

export const TorLoadingModal = ({ onCancel, decision }: TorLoadingModalProps) => {
    const modalType = useSelector(selectModalType);
    const dispatch = useDispatch();

    const callback = (result: boolean) => {
        onCancel();
        decision.resolve(result);
    };

    const handleToggleTor = (shouldEnable: boolean) => dispatch(toggleTor(shouldEnable, modalType));

    return <TorLoader callback={callback} onToggleTor={handleToggleTor} />;
};
