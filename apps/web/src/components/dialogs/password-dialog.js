import React, { useState, useCallback, useMemo } from "react";
import { Box, Text } from "rebass";
import Dialog from "./dialog";
import Field from "../field";

const requiredValues = ["password", "newPassword", "oldPassword"];
function PasswordDialog(props) {
  const { type } = props;
  const [error, setError] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const isChangePasswordDialog = useMemo(() => {
    return type === "change_password" || type === "change_account_password";
  }, [type]);

  const submit = useCallback(
    async (data) => {
      setIsLoading(true);
      setError(false);
      try {
        if (await props.validate(data)) {
          props.onDone();
        } else {
          setError("Wrong password.");
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    },
    [props]
  );
  return (
    <Dialog
      isOpen={true}
      title={props.title}
      description={props.subtitle}
      icon={props.icon}
      onClose={props.onClose}
      positiveButton={{
        props: {
          form: "passwordForm",
          type: "submit",
        },
        text: props.positiveButtonText,
        loading: isLoading,
        disabled: isLoading,
      }}
      negativeButton={{ text: "Cancel", onClick: props.onClose }}
    >
      <Box
        id="passwordForm"
        as="form"
        onSubmit={async (e) => {
          e.preventDefault();
          const data = requiredValues.reduce((prev, curr) => {
            if (!e.target[curr]) return prev;
            prev[curr] = e.target[curr].value;
            return prev;
          }, {});

          setError();

          await submit(data);
        }}
      >
        <Field
          autoFocus
          required
          data-test-id="dialog-password"
          label={isChangePasswordDialog ? "Old password" : "Password"}
          type="password"
          autoComplete={
            type === "create_vault" ? "new-password" : "current-password"
          }
          id={isChangePasswordDialog ? "oldPassword" : "password"}
          name={isChangePasswordDialog ? "oldPassword" : "password"}
        />

        {isChangePasswordDialog ? (
          <Field
            required
            label="New password"
            type="password"
            autoComplete="new-password"
            id="newPassword"
            name="newPassword"
          />
        ) : null}

        {error && (
          <Text mt={1} variant={"error"}>
            {error}
          </Text>
        )}
      </Box>
    </Dialog>
  );
}
export default PasswordDialog;