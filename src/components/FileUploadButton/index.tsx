import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { Button, Tooltip, type ButtonTypeMap } from '@mui/material';
import { type ChangeEvent, type FC, type ReactNode, useRef } from 'react';

interface FileUploadButtonProps {
  accept?: string;
  buttonSize?: ButtonTypeMap['props']['size'];
  buttonSx?: ButtonTypeMap['props']['sx'];
  buttonText?: string;
  buttonVariant?: ButtonTypeMap['props']['variant'];
  disabled?: boolean;
  multiple?: boolean;
  onFileSelectSuccess: (files: FileList) => void;
  tooltipText?: ReactNode;
}

/**
 * Renders a reusable file upload button.
 *
 * @param root0 Component props.
 * @param root0.accept Accepted file types (e.g. '.log,.txt').
 * @param root0.buttonSize MUI button size.
 * @param root0.buttonSx Additional MUI sx styles for the button.
 * @param root0.buttonText Label text displayed on the button.
 * @param root0.buttonVariant MUI button variant.
 * @param root0.disabled Whether the button is disabled.
 * @param root0.multiple Whether multiple files can be selected.
 * @param root0.onFileSelectSuccess Callback invoked with the selected FileList.
 * @param root0.tooltipText Tooltip content shown on hover.
 * @returns JSX for the file upload button.
 */
export const FileUploadButton: FC<FileUploadButtonProps> = ({
  accept,
  buttonSize = 'medium',
  buttonSx,
  buttonText,
  buttonVariant,
  disabled = false,
  multiple,
  onFileSelectSuccess,
  tooltipText,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFileSelectSuccess(event.target.files);
      event.target.value = '';
    }
  };

  return (
    <>
      <label hidden htmlFor="contained-button-file">
        <input
          accept={accept ?? '*/*'}
          disabled={disabled}
          id="contained-button-file"
          multiple={multiple}
          onChange={handleFilesChange}
          ref={inputRef}
          type="file"
        />
      </label>
      <Tooltip arrow title={tooltipText ?? ''}>
        <Button
          component="span"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          size={buttonSize}
          startIcon={<FileUploadOutlinedIcon />}
          sx={buttonSx ?? {}}
          variant={buttonVariant ?? 'contained'}
        >
          {buttonText ?? 'Upload'}
        </Button>
      </Tooltip>
    </>
  );
};
