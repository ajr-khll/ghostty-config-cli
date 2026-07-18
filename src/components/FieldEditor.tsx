import React from "react";
import type { FieldProps } from "./fieldProps.js";
import ColorField from "./ColorField.js";
import EnumField from "./EnumField.js";
import BoolField from "./BoolField.js";
import SliderField from "./SliderField.js";
import SearchSelectField from "./SearchSelectField.js";

/** Dispatches to the right editor component based on the field kind. */
export default function FieldEditor(props: FieldProps) {
  switch (props.field.kind) {
    case "color":
      return <ColorField {...props} />;
    case "enum":
      return <EnumField {...props} />;
    case "bool":
      return <BoolField {...props} />;
    case "slider":
      return <SliderField {...props} />;
    case "text":
      return <SearchSelectField {...props} />;
    default:
      return null;
  }
}
