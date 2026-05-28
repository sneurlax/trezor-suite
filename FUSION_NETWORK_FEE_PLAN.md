# Plán: 0 ETH / $0 network fee pro 1inch Fusion

**Issue:** [trezor/trezor-suite#27911](https://github.com/trezor/trezor-suite/issues/27911) — _Fix network fees for 1inch Fusion_
**Cíl:** Zobrazit `0 ETH` a `$0` za network fee v **trade formu** i v **trade preview**, když je vybraný provider 1inch Fusion.
**Assignee:** sherpaPSX

---

## 1. Proč má být fee 0 — jak 1inch Fusion funguje

1inch Fusion je **gasless swap**:

- Uživatel **nevysílá vlastní on-chain transakci**. Místo toho **podepíše EIP-712 typed-data objednávku** (fusion order) — viz [EIP-712](https://eips.ethereum.org/EIPS/eip-712).
- Order on-chain provede a vyplní **resolver**, který také **zaplatí gas** (náklad si promítne do směnného kurzu).
- Pro uživatele tedy neexistuje network fee → ve formu i v preview má být `0 ETH / $0`.

V podpisovém toku se to projeví voláním `ethereumSignTypedData` místo `signTransaction`
([signDataAndConfirmThunk.ts:77](suite-common/trading/src/thunks/exchange/signDataAndConfirmThunk.ts#L77)).

---

## 2. Co říká reálná response (z `/api/v3/exchange/trade`)

Zachycená fusion response (zkráceno):

```jsonc
{
  "exchange": "1inchfusion",
  "fee": "UNKNOWN",
  "status": "CONFIRM",
  "isDex": true,
  "dexTx": { "from": "0x…", "to": "0x111111125421ca…", "data": "", "value": "0" },  // ⚠ prázdná data
  "signData": { "type": "eip712-typed-data", "data": { "primaryType": "Order", … } },
  "preapprovedStringAmount": "1157920892…",  // ~∞, token už approved
  "extraData": { "order": { … }, "extension": "0x…" }
}
```

Zjištění:

1. **Provider name = `"1inchfusion"`** (fixture má navíc `1inchfusionplus`). → seznam: `['1inchfusion', '1inchfusionplus']`.
2. **`fee: "UNKNOWN"`** — backend fee nezná.
3. **`dexTx` existuje, ale `data: ""` a `value: "0"`** — gasless marker: dexTx je, ale **není co vysílat**.
4. **`signData.type === "eip712-typed-data"`** je přítomné (EIP-712 Order pro 1inch Router v6).

---

## 3. Endpointy a v jaké fázi co máme

`suite-common/trading/src/invityAPI.ts:72-73`:

- `/api/v3/exchange/quotes` → **getExchangeQuotes** = seznam nabídek (trade form + preview před potvrzením)
- `/api/v3/exchange/trade` → **doExchangeTrade** = po výběru nabídky a kliknutí na potvrzení

Výše uvedená response je z **`/exchange/trade`**, tj. **až po potvrzení**. `signData`, populated `dexTx`,
`orderId`, `status` a adresy přicházejí teprve tady. FE navíc `signData` z quote nikdy nečte —
[TradingOfferExchange.tsx:55](packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchange.tsx#L55)
ho gate-uje přes `formStep === 'SIGN_DATA' && !!signData`.

| Fáze (z issue)                                      | Endpoint           | Dostupné                      | Detekce                              |
| --------------------------------------------------- | ------------------ | ----------------------------- | ------------------------------------ |
| **Trade form** (fee u inputu)                       | `/exchange/quotes` | `exchange`, `isDex`           | **provider name**                    |
| **Trade preview** (RECEIVING_ADDRESS, před confirm) | `/exchange/quotes` | `exchange`, `isDex`           | **provider name**                    |
| Po confirm (SIGN_DATA / CONFIRM)                    | `/exchange/trade`  | `signData`, `dexTx.data===''` | `signData.type` / prázdná dexTx data |

> **KLÍČOVÉ:** Obě místa z issue (form i preview) jsou **před** `/exchange/trade`, takže tam
> `signData` ani populated `dexTx` nejsou. **Primární a pro task nutný signál je provider name.**
> `signData.type` je jen pozdní potvrzení — pro zobrazení 0 fee ho prakticky nepotřebujeme.
>
> ⚠️ Stále nemáme zachycenou raw `/exchange/quotes` response pro fusion — vhodné u BE ověřit
> úplný výčet gasless providerů a zda quote náhodou `signData` nenese.

---

## 4. Root cause bugu (opraveno reálnými daty)

Fusion quote **má `dexTx`, ale s prázdnou `data`**. V efektu
[useTradingExchangeForm.ts:592](packages/suite/src/hooks/wallet/trading/form/useTradingExchangeForm.ts#L592)
podmínka `if (!quote?.dexTx)` **neplatí** (dexTx existuje), takže se nastaví:

```ts
setValue('transactionData', dexTx.data); // = "" (prázdné)
setValue(TRADING_FORM_OUTPUT_ADDRESS, dexTx.to); // = router adresa
```

→ form **zcompose-uje transakci s prázdnou data** → vyleze minimální/nesmyslná gas fee.
**To je přesně ten špatný fee z issue.**

> Pozn.: fee na formu jinak **NENÍ fake** — pro CEX transfer i pro DEX approve/swap se composuje
> reálná transakce z `dexTx` ([ř. 599-603](packages/suite/src/hooks/wallet/trading/form/useTradingExchangeForm.ts#L599))
> a fee je reálný odhad gasu. Jen u gasless fusionu žádná uživatelská tx neexistuje → správná fee = 0.

---

## 5. Detekční utilita

Do [exchangeUtils.ts](suite-common/trading/src/utils/exchange/exchangeUtils.ts) (kde už jsou
`requiresTokenApproval`, `isSendingEvmNativeToken`), přidat predikát + export přes `exchangeUtils` + unit testy.

```ts
const GASLESS_EXCHANGES = ['1inchfusion', '1inchfusionplus'];

/** Gasless swap (1inch Fusion): EIP-712 order, gas platí resolver → žádné network fee. */
export const isGaslessExchangeQuote = (quote?: ExchangeTrade): boolean =>
    !!quote &&
    (GASLESS_EXCHANGES.includes(quote.exchange ?? '') || // primární — funguje i ve form/preview
        quote.signData?.type === 'eip712-typed-data'); // doplňkové — až po confirm
```

---

## 6. Form vs context — proč to patří do contextu

`feeInUnits` se dnes počítá **3×** přes `getFeeInUnits(...)`, nekonzistentně:

| Místo                                                                                                                                                                              | `symbol`                   | Použití                                          |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------ |
| [TradingFormInputCryptoAmount.tsx:71](packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount.tsx#L71) | `validationAccount.symbol` | zobrazení + **validační pravidla** (ř. 125, 138) |
| [TradingFormInputFiat.tsx:96](packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiat.tsx#L96)                 | `account.symbol`           | zobrazení fiat fee                               |
| [useTradingFormActions.ts:110](packages/suite/src/hooks/wallet/trading/form/common/useTradingFormActions.ts#L110)                                                                  | `account.symbol`           | výpočet max/fraction (`fee:` ř. 253)             |

Kdyby se nula řešila jen ve dvou input komponentách:

- zapomnělo by se na `useTradingFormActions` → max button by počítal se starým fee,
- **validační pravidlo** ([tradingFormInputFiatCryptoRules.ts:208](packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/tradingFormInputFiatCryptoRules.ts#L208)) by pořád odečítalo network-reserve fee → uživatel by neposlal plný balance.

→ `feeInUnits` patří do **form contextu**, počítaný jednou, už s gasless override. Sedí to i s branch
`feat/trading-26288-optimize-form-rerenders` (jeden memoizovaný výpočet místo tří).

Preview quote je dosažitelný i ve form fázi přes
[`getSelectedQuote(context)`](packages/suite/src/utils/wallet/trading/tradingTypingUtils.ts#L192)
(první quote dle vybraného `provider`, jinak `quotes[0]`).

---

## 7. Rozhodnutí

| Otázka                      | Volba                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Rozsah refaktoringu         | **Exchange + sell context** — `feeInUnits` vystavit na obou, sjednotit všechny 3 call-sites (sell bez gasless override). |
| Gasless override platí pro… | **Všude** — zobrazení, network-reserve validace i max/fraction button.                                                   |

---

## 8. Implementační plán

### 8.1 Utilita + testy

- [ ] `isGaslessExchangeQuote` do [exchangeUtils.ts](suite-common/trading/src/utils/exchange/exchangeUtils.ts) + export přes `exchangeUtils`.
- [ ] Unit testy: detekce přes provider name, přes `signData.type`, negativní případy (CEX, jiný DEX, undefined).

### 8.2 Vystavit `feeInUnits` na contextu

- [ ] **Exchange** ([useTradingExchangeForm.ts](packages/suite/src/hooks/wallet/trading/form/useTradingExchangeForm.ts)): spočítat jednou
    ```ts
    const previewQuote = getSelectedQuote(context); // nebo inline z cex/dexQuotes + provider
    const rawFee = getFeeInUnits({
        symbol: account.symbol,
        composedLevels,
        selectedFee: composedTransactionInfo?.selectedFee,
    });
    const feeInUnits = isGaslessExchangeQuote(previewQuote) ? '0' : rawFee;
    ```
    a přidat `feeInUnits` do return (ř. 693–752).
- [ ] **Sell** (`useTradingSellForm.ts`): `feeInUnits` bez gasless override, přidat do return.
- [ ] Sjednotit `symbol` na jeden kanonický send-symbol (dnes crypto vs fiat/actions nekonzistentní).

### 8.3 Typy contextu

- [ ] V [tradingForm.ts](packages/suite/src/types/trading/tradingForm.ts) přidat `feeInUnits: string` do `TradingExchangeFormContextProps` a `TradingSellFormContextProps`.

### 8.4 Přepojit konzumenty na `context.feeInUnits`

- [ ] [TradingFormInputCryptoAmount.tsx:71](packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount.tsx#L71) (vč. rules ř. 125, 138).
- [ ] [TradingFormInputFiat.tsx:96](packages/suite/src/views/wallet/trading/common/TradingForm/TradingFormInput/TradingFormInputFiatCrypto/TradingFormInputFiat.tsx#L96).
- [ ] [useTradingFormActions.ts:110](packages/suite/src/hooks/wallet/trading/form/common/useTradingFormActions.ts#L110) (dopad na max/fraction).
- [ ] `tradingFormInputFiatCryptoRules.ts` — jen propíše novou `feeInUnits` prop.

### 8.5 Preview

- [ ] [TradingOfferExchangeDetails.tsx:55](packages/suite/src/views/wallet/trading/common/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeDetails.tsx#L55) — `networkFee = isGaslessExchangeQuote(exchangeQuote) ? '0' : composed?.fee`.
- [ ] [TradingDetailExchange.tsx:77](packages/suite/src/views/wallet/trading/common/TradingDetail/TradingDetailExchange/TradingDetailExchange.tsx#L77) — totéž.
- [ ] Ověřit `formatNetworkAmount('0', symbol)` → `0 ETH`; fiat → `$0`.

### 8.6 Kontrola dalších míst

- [ ] Projít, zda fee neuniká jinde (souhrn tx, analytika, redirect).

---

## 9. Otevřené otázky

1. Úplný výčet gasless providerů u BE (kromě `1inchfusion` / `1inchfusionplus`).
2. Nese raw `/exchange/quotes` response pro fusion `signData`/prázdné `dexTx`? (zatím nezachyceno → spoléháme na provider name).

---

## 10. Klíčové soubory

| Účel                           | Soubor                                                                           |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Typ quote (`signData`)         | `node_modules/@types/invity-api/index.d.ts:384`                                  |
| Endpoint mapping               | `suite-common/trading/src/invityAPI.ts:72-73`                                    |
| Bug root cause (dexTx compose) | `useTradingExchangeForm.ts:592-603`                                              |
| Místo pro utilitu              | `suite-common/trading/src/utils/exchange/exchangeUtils.ts`                       |
| Preview quote selektor         | `packages/suite/src/utils/wallet/trading/tradingTypingUtils.ts:192`              |
| `getFeeInUnits`                | `packages/suite/src/utils/wallet/trading/tradingUtils.ts:222`                    |
| Form fee (crypto)              | `…/TradingFormInputFiatCrypto/TradingFormInputCryptoAmount.tsx:71`               |
| Form fee (fiat)                | `…/TradingFormInputFiatCrypto/TradingFormInputFiat.tsx:96`                       |
| Validační pravidla             | `…/TradingFormInputFiatCrypto/tradingFormInputFiatCryptoRules.ts:208`            |
| Form actions (max)             | `…/form/common/useTradingFormActions.ts:110`                                     |
| Context typy                   | `packages/suite/src/types/trading/tradingForm.ts`                                |
| Preview detail                 | `…/TradingSelectedOffer/TradingOfferExchange/TradingOfferExchangeDetails.tsx:55` |
| Detail (jiná cesta)            | `…/TradingDetail/TradingDetailExchange/TradingDetailExchange.tsx:77`             |
