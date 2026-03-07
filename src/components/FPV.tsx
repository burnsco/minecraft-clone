import { PointerLockControls } from "@react-three/drei";

interface FPVProps {
    onLockChange: (locked: boolean) => void;
}

export const FPV = ({ onLockChange }: FPVProps) => {
    return (
        <PointerLockControls
            makeDefault
            selector="#pointer-lock-target"
            onLock={() => onLockChange(true)}
            onUnlock={() => onLockChange(false)}
        />
    );
}
