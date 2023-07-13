import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import Slider from "rc-slider";
import MainInput from "../../../components/form/MainInput";
import { METADATA_OF_ASSET, POOL_CONTRACT_ABI, POOL_CONTRACT_ADDRESS, REGEX_NUMBER_VALID, USDC_CONTRACT_ADDRESS, WETH_CONTRACT_ADDRESS } from "../../../utils/constants";
import OutlinedButton from "../../../components/buttons/OutlinedButton";
import FilledButton from "../../../components/buttons/FilledButton";
import TextButton from "../../../components/buttons/TextButton";
import MoreInfo from "./MoreInfo";
import { TAsset } from "../../../utils/types";
import { useAccount, useBalance, useContractWrite, usePrepareContractWrite } from "wagmi";
import useLoading from "../../../hooks/useLoading";
import { toast } from "react-toastify";
import { parseEther } from "viem";

//  ----------------------------------------------------------------------------------------------------

interface IProps {
  asset: TAsset;
}

//  ----------------------------------------------------------------------------------------------------

export default function DepositTab({ asset }: IProps) {
  const [amount, setAmount] = useState<string>('0')
  const [moreInfoCollapsed, setMoreInfoCollapsed] = useState<boolean>(false)

  //  -----------------------------------------------------

  const { address } = useAccount()
  const { openLoading, closeLoading } = useLoading()
  const { data: balanceData, isError: useBalanceIsError, isLoading: useBalanceIsLoading } = useBalance({
    address,
    token: asset === 'usdc' ? USDC_CONTRACT_ADDRESS : undefined
  })
  const { write, isError: useContractWriteIsError, isLoading: useContractWriteIsLoading, isSuccess: useContractWriteIsSuccess } = useContractWrite({
    address: POOL_CONTRACT_ADDRESS,
    abi: POOL_CONTRACT_ABI,
    functionName: 'deposit',
    args: [asset === 'eth' ? WETH_CONTRACT_ADDRESS : USDC_CONTRACT_ADDRESS, Number(amount) * 10 ** Number(balanceData?.decimals)],
  })

  //  -----------------------------------------------------

  const handleAmount = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;

    if (value.match(REGEX_NUMBER_VALID)) {
      setAmount(value);
    }
  }

  const handleWrite = () => {
    if (asset === 'eth') {
      return write({
        value: parseEther(`${Number(amount)}`)
      })
    } else {
      return write({
        value: parseEther(`0`)
      })
    }
  }

  //  -----------------------------------------------------

  const amountIsValid = useMemo<boolean>(() => {
    const amountInNumber = Number(amount);
    const balanceInNumber = Number(balanceData?.formatted);
    if (amountInNumber !== 0) {
      if (amountInNumber <= balanceInNumber) {
        return true;
      }
    }
    return false;
  }, [amount, balanceData?.formatted])

  //  -----------------------------------------------------

  useEffect(() => {
    if (useBalanceIsError) {
      toast.error('useBalance() occurred error.')
    }
  }, [useBalanceIsError])

  useEffect(() => {
    if (useContractWriteIsError) {
      toast.error('useContractWrite() occurred error.')
    }
  }, [useContractWriteIsError])

  useEffect(() => {
    if (useBalanceIsLoading || useContractWriteIsLoading) {
      openLoading()
    } else {
      closeLoading()
    }
  }, [useBalanceIsLoading, useContractWriteIsLoading])

  useEffect(() => {
    if (useContractWriteIsSuccess) {
      closeLoading();
      toast.success('Deposit success!');
    }
  }, [useContractWriteIsSuccess])

  //  -----------------------------------------------------

  return (
    <>
      <div className="flex flex-col gap-2">
        <MainInput
          endAdornment={<span className="text-gray-100">{METADATA_OF_ASSET[asset].symbol}</span>}
          onChange={handleAmount}
          value={amount}
        />

        <div className="flex items-center justify-between">
          <p className="text-gray-500">Max: {Number(balanceData?.formatted).toFixed(4)} {METADATA_OF_ASSET[asset].symbol}</p>
          <div className="flex items-center gap-2">
            <OutlinedButton
              className="text-xs px-2 py-1"
              onClick={() => setAmount(`${Number(balanceData?.formatted) / 2}`)}
            >half</OutlinedButton>
            <OutlinedButton
              className="text-xs px-2 py-1"
              onClick={() => setAmount(`${balanceData?.formatted}`)}
            >max</OutlinedButton>
          </div>
        </div>

        <div className="mt-4 px-2">
          <Slider
            marks={{
              0: '0%',
              25: '25%',
              50: '50%',
              75: '75%',
              100: '100%'
            }}
            className="bg-gray-900"
            railStyle={{ backgroundColor: '#3F3F46' }}
            trackStyle={{ backgroundColor: '#3B82F6' }}
          />
        </div>

        <div className="flex flex-col gap-2 text-sm mt-8">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Deposited</span>
            <span className="text-gray-100">0 USDC</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">APY</span>
            <span className="text-gray-100">1.19%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">Wallet</span>
            <span className="text-gray-100">2.89039 USDC</span>
          </div>
        </div>

        <FilledButton
          className="mt-8 py-2 text-base"
          disabled={!write || !amountIsValid}
          onClick={handleWrite}
        >
          Supply
        </FilledButton>

        <div className="flex items-center">
          <div className="flex-1 h-[1px] bg-gray-800" />
          <TextButton className="flex items-center gap-2" onClick={() => setMoreInfoCollapsed(!moreInfoCollapsed)}>
            More Info
            <Icon icon={moreInfoCollapsed ? 'ep:arrow-up-bold' : 'ep:arrow-down-bold'} />
          </TextButton>
          <div className="flex-1 h-[1px] bg-gray-800" />
        </div>

        {moreInfoCollapsed && (
          <MoreInfo />
        )}
      </div>
    </>
  )
}