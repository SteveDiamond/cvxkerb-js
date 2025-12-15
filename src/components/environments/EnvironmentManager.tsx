import { useEnvironmentStore } from '../../stores/environmentStore';
import { DroneShip } from './DroneShip';
import { OceanEnvironment } from './OceanEnvironment';
import { RTLSTerrain } from './RTLSPad';
import { MarsTerrain } from './MarsTerrain';

interface EnvironmentManagerProps {
  landingPadPosition: [number, number, number];
}

export function EnvironmentManager({ landingPadPosition }: EnvironmentManagerProps) {
  const { environmentType } = useEnvironmentStore();

  switch (environmentType) {
    case 'droneShip':
      return (
        <>
          <OceanEnvironment />
          <DroneShip position={landingPadPosition} />
        </>
      );

    case 'rtls':
      return <RTLSTerrain />;

    case 'mars':
      return <MarsTerrain />;

    default:
      return null;
  }
}
