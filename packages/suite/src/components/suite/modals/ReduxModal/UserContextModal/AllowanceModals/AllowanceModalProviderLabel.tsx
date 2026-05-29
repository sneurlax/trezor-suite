import styled from 'styled-components';

import { type TranslationKey } from '@suite/intl';
import { invityAPI } from '@suite-common/trading';
import { Image, Row, Text } from '@trezor/components';
import { type TypographyStyle, borders } from '@trezor/theme';
import { exhaustive } from '@trezor/type-utils';

export type ProviderLogoSourceType = 'invity-api-path' | 'url';

export type AllowanceModalProvider = {
    name?: string;
    companyName?: string;
    logo?: string;
    label: TranslationKey;
};

interface AllowanceModalProviderLabelProps {
    provider: AllowanceModalProvider;
    logoSourceType?: ProviderLogoSourceType;
    typographyStyle?: TypographyStyle;
}

const Wrapper = styled.div`
    display: grid;
    grid-template-columns: 1.5rem auto;
    gap: 0.5rem;
`;

const getProviderLogoSource = (
    logo: string | undefined,
    logoSourceType: ProviderLogoSourceType = 'invity-api-path',
) => {
    if (!logo) return null;
    switch (logoSourceType) {
        case 'url':
            return logo;
        case 'invity-api-path':
            return invityAPI.getProviderLogoUrl(logo);
        default:
            return exhaustive(logoSourceType);
    }
};

export const AllowanceModalProviderLabel = ({
    provider,
    logoSourceType,
    typographyStyle,
}: AllowanceModalProviderLabelProps) => {
    const logoSource = getProviderLogoSource(provider.logo, logoSourceType);
    const providerName = provider.companyName ?? provider.name;

    return (
        <Wrapper>
            {logoSource && (
                <Row alignItems="center" justifyContent="center">
                    <Image
                        imageSrc={logoSource}
                        maxHeight={typographyStyle === 'body-sm' ? 20 : 24}
                        borderRadius={borders.radii.xxxs}
                    />
                </Row>
            )}
            <Text typographyStyle={typographyStyle}>{providerName}</Text>
        </Wrapper>
    );
};
