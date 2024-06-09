// import { useUtils } from '@tma.js/sdk-react';
import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';
import {
    // Avatar,
    Cell,
    List,
    ButtonCell,
    // Navigation,
    Placeholder,
    // Section,
    Text,
    // Title,
} from '@telegram-apps/telegram-ui';
import type { FC } from 'react';

// import { DisplayData } from '@/components/DisplayData/DisplayData.tsx';
import { Product } from '../../components/Product/Product';

// import './TONConnectPage.css';

export const ProductPage: FC = () => {
    const wallet = useTonWallet();

    // const utils = useUtils();

    // if (!wallet) {
    //     return (
    //         <Placeholder
    //             className='ton-connect-page__placeholder'
    //             header='TON Connect'
    //             description={
    //                 <>
    //                     <Text>
    //                         To display products connect your wallet
    //                     </Text>
    //                     <TonConnectButton className='ton-connect-page__button' />
    //                 </>
    //             }
    //         />
    //     );
    // }

    // const {
    //     account: { chain, publicKey, address },
    //     device: {
    //         appName,
    //         appVersion,
    //         maxProtocolVersion,
    //         platform,
    //         features,
    //     },
    // } = wallet;
    const test: number[] = [...Array(3).keys()];
    console.log(test)
    return (
        <List style={{ display: 'grid', gridTemplateRows: ' 1fr 7fr 1fr', height: '100vh' }}>

            <div style={{ padding: '10px', marginBottom: '0px', borderRadius: '10px' }}>
                <Cell
                    style={{ backgroundColor: '#6c6c6c', borderRadius: '10px ' }}
                >
                    Wallet: EQCeMT....JlBsE5dVEuI
                </Cell>
            </div>

            <div style={{ margin: '10px', maxHeight: '90vh', borderRadius: '10px', rowGap: '10px', overflowY: 'scroll' }}>
                {/* {test.map(() => { */}
                <Product />
                {/* })} */}

            </div>

            <div style={{ margin: '10px', borderRadius: '10px' }}>
                <ButtonCell
                    style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#007AFF', borderRadius: '10px', textAlign: 'center', color: '#fff' }} >
                    <b style={{}}>Mint new product</b>
                </ButtonCell>
            </div>
        </List >

    );
};
