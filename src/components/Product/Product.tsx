// import { isRGB, useUtils } from '@tma.js/sdk-react';
import { Button, Cell, Image } from '@telegram-apps/telegram-ui';
// import type { ReactNode } from 'react';
// import {
//     Avatar,

//     List,
//     Navigation,
//     Section,
//     Text,
//     Title,
// } from '@telegram-apps/telegram-ui';
import type { FC } from 'react';

// import { DisplayData } from '@/components/DisplayData/DisplayData.tsx';

import './TONConnectPage.css';

// import { RGB } from '@/components/RGB/RGB.tsx';
// import { Link } from '@/components/Link/Link.tsx';
// import { TonConnectButton, useTonWallet } from '@tonconnect/ui-react';

// import './DisplayData.css';

// export type DisplayDataRow =
//     & { title: string }
//     & (
//         | { type: 'link'; value?: string }
//         | { value: ReactNode }
//     )

// export interface DisplayDataProps {
//     header?: ReactNode;
//     footer?: ReactNode;
//     rows: DisplayDataRow[];
// }

export const Product: FC = () => {
    // const wallet = useTonWallet();
    // const utils = useUtils();
    // console.log(wallet?.provider)

    // if (!wallet) {
    //     return (
    //         <Placeholder
    //             className='ton-connect-page__placeholder'
    //             header='TON Connect'
    //             description={
    //                 <>
    //                     <Text>
    //                         To display the data related to the TON Connect, it is required to connect your wallet
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

    return (

        <><Cell style={{ marginBottom: '10px' }}
            after={<Button type="text" onClick={(e) => { e.preventDefault(); console.log('bought'); }}>Buy</Button>}
            before={<Image
                fallbackIcon={<span>😕</span>}
                // size={100}
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8Hk2L_bcRmBY11t-Lvw5ficIslXpGrhMYXGKXzpQ2C1PCqutE"
            ></Image>}
            subtitle="Price: 0.2 TON"

        >
            Tomato
        </Cell><Cell style={{ marginBottom: '10px' }}
            after={<Button type="text" onClick={(e) => { e.preventDefault(); console.log('bought'); }}>Buy</Button>}
            before={<Image
                fallbackIcon={<span>😕</span>}
                // size={100}
                src="https://encrypted-tbn3.gstatic.com/images?q=tbn:ANd9GcQ8l_qhT0QnxLfyknGC4FoMyrpVcP21OWvaPB-H_TK6yNYsnIN_"
            ></Image>}
            subtitle="Price: 0.3 TON"

        >
                Apple
            </Cell>
            <Cell style={{ marginBottom: '10px' }}
                after={<Button type="text" onClick={(e) => { e.preventDefault(); console.log('bought'); }}>Buy</Button>}
                before={<Image
                    fallbackIcon={<span>😕</span>}
                    // size={100}
                    src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSA3ke38iQ5ciYfmgwXr5EyIEyQQMVPG1DAcE5y-ouG_yqqUHdd"
                ></Image>}
                subtitle="Price: 0.1 TON"

            >
                Cocumber
            </Cell>

        </>

    );
};
