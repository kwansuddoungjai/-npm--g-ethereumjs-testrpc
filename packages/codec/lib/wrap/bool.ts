import debugModule from "debug";
const debug = debugModule("codec:wrap:bool");

import type * as Format from "@truffle/codec/format";
import { wrapWithCases } from "./dispatch";
import { TypeMismatchError } from "./errors";
import type { WrapResponse } from "../types";
import type { Case, WrapOptions } from "./types";
import * as Utils from "./utils";
import * as Messages from "./messages";

const boolCasesBasic: Case<
  Format.Types.BoolType,
  Format.Values.BoolValue,
  never
>[] = [
  boolFromBoolean, //needed due to strictBooleans mode
  boolFromString,
  boolFromBoxedPrimitive,
  boolFromCodecBoolValue,
  boolFromCodecBoolError,
  boolFromCodecUdvtValue,
  boolFromCodecUdvtError,
  boolFromOther //must go last!
];

export const boolCases: Case<
  Format.Types.BoolType,
  Format.Values.BoolValue,
  never
>[] = [boolFromTypeValueInput, ...boolCasesBasic];

function* boolFromBoolean(
  dataType: Format.Types.BoolType,
  input: unknown,
  wrapOptions: WrapOptions
): Generator<never, Format.Values.BoolValue, WrapResponse> {
  if (typeof input !== "boolean") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was not a boolean"
    );
  }
  return {
    type: dataType,
    kind: "value" as const,
    value: {
      asBoolean: input
    },
    interpretations: {}
  };
}

function* boolFromString(
  dataType: Format.Types.BoolType,
  input: unknown,
  wrapOptions: WrapOptions
): Generator<never, Format.Values.BoolValue, WrapResponse> {
  if (typeof input !== "string") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was not a string"
    );
  }
  const lowerCasedInput = input.toLowerCase();
  if (
    wrapOptions.strictBooleans &&
    !["true", "false", "1", "0"].includes(lowerCasedInput)
  ) {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      5,
      "Input was not 'true', 'false', '1', or '0'"
    );
  }
  //strings are true unless they're falsy or the case-insensitive strings "false" or "0"
  const asBoolean = Boolean(input) && !["false", "0"].includes(lowerCasedInput);
  return {
    type: dataType,
    kind: "value" as const,
    value: {
      asBoolean
    },
    interpretations: {}
  };
}

function* boolFromBoxedPrimitive(
  dataType: Format.Types.BoolType,
  input: unknown,
  wrapOptions: WrapOptions
): Generator<never, Format.Values.BoolValue, WrapResponse> {
  if (!Utils.isBoxedPrimitive(input)) {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was not a boxed primitive"
    );
  }
  //unbox and try again
  return yield* wrapWithCases(
    dataType,
    input.valueOf(),
    wrapOptions,
    boolCases
  );
}

function* boolFromCodecBoolValue(
  dataType: Format.Types.BoolType,
  input: unknown,
  wrapOptions: WrapOptions
): Generator<never, Format.Values.BoolValue, WrapResponse> {
  if (!Utils.isWrappedResult(input)) {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was not a wrapped result"
    );
  }
  if (input.type.typeClass !== "bool") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      5,
      Messages.wrappedTypeMessage(input.type)
    );
  }
  if (input.kind !== "value") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1, //only specificity 1 due to BoolError case
      Messages.errorResultMessage
    );
  }
  const asBoolean = (<Format.Values.BoolValue>input).value.asBoolean;
  return {
    type: dataType,
    kind: "value" as const,
    value: {
      asBoolean
    },
    interpretations: {}
  };
}

function* boolFromCodecBoolError(
  dataType: Format.Types.BoolType,
  input: unknown,
  wrapOptions: WrapOptions
): Generator<never, Format.Values.BoolValue, WrapResponse> {
  if (!Utils.isWrappedResult(input)) {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was not a wrapped result"
    );
  }
  if (input.type.typeClass !== "bool") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      5,
      Messages.wrappedTypeMessage(input.type)
    );
  }
  if (input.kind !== "error") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was a value rather than an error"
    );
  }
  //these two error types will be regarded as true
  const allowedErrors = ["BoolOutOfRangeError", "BoolPaddingError"];
  if (!allowedErrors.includes(input.error.kind)) {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      5,
      Messages.errorResultMessage
    );
  }
  return {
    type: dataType,
    kind: "value" as const,
    value: {
      asBoolean: true
    },
    interpretations: {}
  };
}

function* boolFromTypeValueInput(
  dataType: Format.Types.BoolType,
  input: unknown,
  wrapOptions: WrapOptions
): Generator<never, Format.Values.BoolValue, WrapResponse> {
  if (!Utils.isTypeValueInput(input)) {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was not a type/value pair"
    );
  }
  if (input.type !== "bool") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      5,
      Messages.specifiedTypeMessage(input.type)
    );
  }
  //extract value & try again, disallowing type/value input
  return yield* wrapWithCases(
    dataType,
    input.value,
    { ...wrapOptions, loose: true },
    boolCasesBasic
  );
}

function* boolFromCodecUdvtValue(
  dataType: Format.Types.BoolType,
  input: unknown,
  wrapOptions: WrapOptions
): Generator<never, Format.Values.BoolValue, WrapResponse> {
  if (!Utils.isWrappedResult(input)) {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was not a wrapped result"
    );
  }
  if (input.type.typeClass !== "userDefinedValueType") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      Messages.wrappedTypeMessage(input.type)
    );
  }
  if (input.kind !== "value") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      5,
      Messages.errorResultMessage
    );
  }
  return yield* boolFromCodecBoolValue(dataType, input.value, wrapOptions);
}

function* boolFromCodecUdvtError(
  dataType: Format.Types.BoolType,
  input: unknown,
  wrapOptions: WrapOptions
): Generator<never, Format.Values.BoolValue, WrapResponse> {
  if (!Utils.isWrappedResult(input)) {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was not a wrapped result"
    );
  }
  if (input.type.typeClass !== "userDefinedValueType") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      Messages.wrappedTypeMessage(input.type)
    );
  }
  if (input.kind !== "error") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was a value rather than an error"
    );
  }
  //wrapped errors will have to be unwrapped, others can be rejected
  if (input.error.kind !== "WrappedError") {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      5,
      Messages.errorResultMessage
    );
  }
  return yield* boolFromCodecBoolError(
    dataType,
    input.error.error,
    wrapOptions
  );
}

function* boolFromOther(
  dataType: Format.Types.BoolType,
  input: unknown,
  wrapOptions: WrapOptions
): Generator<never, Format.Values.BoolValue, WrapResponse> {
  //fallback case: just go by truthiness/falsiness
  //(this case has to be last because there are various other
  //cases we do not want to go by truthiness/falsiness!)
  if (Utils.isWrappedResult(input)) {
    //...except for these, which may error
    //(note that we do this even when loose is on!)
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was a wrapped result"
    );
  }
  if (Utils.isTypeValueInput(input)) {
    //...and these, which also may error
    //(note that we do this even when loose is on!)
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      1,
      "Input was a type/value pair"
    );
  }
  //...and also we don't do this case if strictBooleans is turned on
  if (wrapOptions.strictBooleans) {
    throw new TypeMismatchError(
      dataType,
      input,
      wrapOptions.name,
      2,
      "Input was neither a boolean nor a boolean string"
    );
  }
  const asBoolean = Boolean(input);
  return {
    type: dataType,
    kind: "value" as const,
    value: {
      asBoolean
    },
    interpretations: {}
  };
}
