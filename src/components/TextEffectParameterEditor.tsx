import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
} from 'react-native';
import {
  TextEffectInstance,
  TextEffectParameterDefinition,
  TextEffectDefinition,
} from '../constants/textEffects';
import { useResponsive } from '../hooks/useResponsive';

interface TextEffectParameterEditorProps {
  effect: TextEffectInstance;
  definition: TextEffectDefinition;
  onChangeParameter: (parameterId: string, value: any) => void;
  onClose?: () => void;
}

const COLOR_SWATCHES = [
  '#FFFFFF',
  '#FF00FF',
  '#00FFFF',
  '#FFD700',
  '#FF4500',
  '#00FF7F',
  '#1E90FF',
  '#8A2BE2',
  '#000000',
];

const TextEffectParameterEditor: React.FC<TextEffectParameterEditorProps> = ({
  effect,
  definition,
  onChangeParameter,
  onClose,
}) => {
  const { scale, scaleFont, maxPanelHeight, smallButtonSize } = useResponsive();

  const renderNumericControl = (parameter: TextEffectParameterDefinition<number>) => {
    const rawValue = Number(effect.parameters[parameter.id] ?? parameter.defaultValue ?? 0);
    const value = isNaN(rawValue) ? 0 : rawValue;
    const min = parameter.min ?? (parameter.type === 'slider' ? 0 : parameter.type === 'angle' ? 0 : undefined);
    const max = parameter.max ?? (parameter.type === 'slider' ? 1 : parameter.type === 'angle' ? 360 : undefined);
    const step = parameter.step ?? (parameter.type === 'angle' ? 5 : 0.1);

    const clamp = (next: number) => {
      let clamped = next;
      if (typeof min === 'number') {
        clamped = Math.max(min, clamped);
      }
      if (typeof max === 'number') {
        clamped = Math.min(max, clamped);
      }
      return parseFloat(clamped.toFixed(3));
    };

    const handleIncrement = (direction: 1 | -1) => {
      const next = clamp(value + direction * step);
      onChangeParameter(parameter.id, next);
    };

    return (
      <View key={parameter.id} style={styles.parameterRow}>
        <View style={styles.parameterLabelColumn}>
          <Text style={[styles.parameterLabel, { fontSize: scaleFont(13) }]}>{parameter.label}</Text>
          {parameter.description ? (
            <Text style={[styles.parameterDescription, { fontSize: scaleFont(11) }]} numberOfLines={2}>
              {parameter.description}
            </Text>
          ) : null}
        </View>
        <View style={styles.numericControlContainer}>
          <TouchableOpacity style={[styles.adjustButton, { width: smallButtonSize, height: smallButtonSize, borderRadius: smallButtonSize / 2 }]} onPress={() => handleIncrement(-1)}>
            <Text style={[styles.adjustButtonText, { fontSize: scaleFont(18) }]}>–</Text>
          </TouchableOpacity>
          <Text style={[styles.numericValue, { fontSize: scaleFont(14) }]}>{value}</Text>
          <TouchableOpacity style={[styles.adjustButton, { width: smallButtonSize, height: smallButtonSize, borderRadius: smallButtonSize / 2 }]} onPress={() => handleIncrement(1)}>
            <Text style={[styles.adjustButtonText, { fontSize: scaleFont(18) }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderBooleanControl = (parameter: TextEffectParameterDefinition<boolean>) => {
    const value = Boolean(effect.parameters[parameter.id] ?? parameter.defaultValue ?? false);
    return (
      <View key={parameter.id} style={styles.parameterRow}>
        <View style={styles.parameterLabelColumn}>
          <Text style={styles.parameterLabel}>{parameter.label}</Text>
          {parameter.description ? (
            <Text style={styles.parameterDescription} numberOfLines={2}>
              {parameter.description}
            </Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={next => onChangeParameter(parameter.id, next)}
          trackColor={{ false: 'rgba(255,255,255,0.3)', true: '#00FFCC' }}
          thumbColor={value ? '#002B36' : '#FFFFFF'}
        />
      </View>
    );
  };

  const renderOptionControl = (
    parameter: TextEffectParameterDefinition<string> & { options?: Array<{ value: string; label: string }> },
  ) => {
    const currentValue = String(effect.parameters[parameter.id] ?? parameter.defaultValue ?? '');
    return (
      <View key={parameter.id} style={styles.parameterColumn}>
        <Text style={styles.parameterLabel}>{parameter.label}</Text>
        <View style={styles.optionRow}>
          {(parameter.options ?? []).map(option => {
            const isActive = option.value === currentValue;
            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionChip, isActive && styles.optionChipActive]}
                onPress={() => onChangeParameter(parameter.id, option.value)}
              >
                <Text style={[styles.optionChipText, isActive && styles.optionChipTextActive]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {parameter.description ? (
          <Text style={styles.parameterDescription} numberOfLines={2}>
            {parameter.description}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderColorControl = (parameter: TextEffectParameterDefinition<string>) => {
    const currentValue = String(effect.parameters[parameter.id] ?? parameter.defaultValue ?? '#FFFFFF');
    const colorSwatchSize = scale(28);
    return (
      <View key={parameter.id} style={styles.parameterColumn}>
        <Text style={[styles.parameterLabel, { fontSize: scaleFont(13) }]}>{parameter.label}</Text>
        <View style={styles.colorRow}>
          {COLOR_SWATCHES.map(color => {
            const isActive = color.toLowerCase() === currentValue.toLowerCase();
            return (
              <TouchableOpacity
                key={color}
                style={[
                  styles.colorSwatch,
                  { backgroundColor: color, width: colorSwatchSize, height: colorSwatchSize, borderRadius: colorSwatchSize / 2 },
                  isActive && styles.colorSwatchActive,
                ]}
                onPress={() => onChangeParameter(parameter.id, color)}
              />
            );
          })}
        </View>
        <TextInput
          style={[styles.colorInput, { fontSize: scaleFont(13), padding: scale(8) }]}
          value={currentValue}
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={text => onChangeParameter(parameter.id, text)}
        />
        {parameter.description ? (
          <Text style={[styles.parameterDescription, { fontSize: scaleFont(11) }]} numberOfLines={2}>
            {parameter.description}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderTextControl = (parameter: TextEffectParameterDefinition<string>) => {
    const currentValue = String(effect.parameters[parameter.id] ?? parameter.defaultValue ?? '');
    return (
      <View key={parameter.id} style={styles.parameterColumn}>
        <Text style={styles.parameterLabel}>{parameter.label}</Text>
        <TextInput
          style={styles.textInput}
          value={currentValue}
          onChangeText={text => onChangeParameter(parameter.id, text)}
          placeholder="Enter value"
          placeholderTextColor="rgba(255,255,255,0.4)"
        />
        {parameter.description ? (
          <Text style={styles.parameterDescription} numberOfLines={2}>
            {parameter.description}
          </Text>
        ) : null}
      </View>
    );
  };

  const renderUnsupported = (parameter: TextEffectParameterDefinition) => (
    <View key={parameter.id} style={styles.parameterColumn}>
      <Text style={styles.parameterLabel}>{parameter.label}</Text>
      <Text style={styles.unsupportedText}>Editing for this parameter type is coming soon.</Text>
    </View>
  );

  const renderParameterControl = (parameter: TextEffectParameterDefinition) => {
    switch (parameter.type) {
      case 'slider':
      case 'angle':
      case 'number':
        return renderNumericControl(parameter as TextEffectParameterDefinition<number>);
      case 'boolean':
        return renderBooleanControl(parameter as TextEffectParameterDefinition<boolean>);
      case 'option':
        return renderOptionControl(
          parameter as TextEffectParameterDefinition<string> & {
            options?: Array<{ value: string; label: string }>;
          },
        );
      case 'color':
        return renderColorControl(parameter as TextEffectParameterDefinition<string>);
      case 'text':
        return renderTextControl(parameter as TextEffectParameterDefinition<string>);
      default:
        return renderUnsupported(parameter);
    }
  };

  return (
    <View style={[styles.editorContainer, { maxHeight: maxPanelHeight, paddingHorizontal: scale(16), paddingVertical: scale(16) }]}>
      <View style={styles.headerRow}>
        <View style={styles.headerTitles}>
          <Text style={[styles.title, { fontSize: scaleFont(16) }]}>{definition.name}</Text>
          <Text style={[styles.subtitle, { fontSize: scaleFont(12) }]}>{definition.description}</Text>
        </View>
        {onClose ? (
          <TouchableOpacity style={[styles.closeButton, { paddingHorizontal: scale(12), paddingVertical: scale(6) }]} onPress={onClose}>
            <Text style={[styles.closeButtonText, { fontSize: scaleFont(13) }]}>Close</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView style={styles.parametersScroll} contentContainerStyle={styles.parametersContent}>
        {definition.parameters.length === 0 ? (
          <Text style={[styles.emptyParametersText, { fontSize: scaleFont(13) }]}>No adjustable parameters for this effect.</Text>
        ) : (
          definition.parameters.map(renderParameterControl)
        )}
      </ScrollView>
    </View>
  );
};

export default TextEffectParameterEditor;

const styles = StyleSheet.create({
  editorContainer: {
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    width: '95%',
    alignSelf: 'center',
    maxHeight: 360,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerTitles: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  parametersScroll: {
    flexGrow: 0,
  },
  parametersContent: {
    gap: 16,
    paddingBottom: 8,
  },
  emptyParametersText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
  },
  parameterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  parameterColumn: {
    gap: 8,
  },
  parameterLabelColumn: {
    flex: 1,
    gap: 4,
  },
  parameterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  parameterDescription: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  numericControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  adjustButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  numericValue: {
    color: '#FFFFFF',
    fontWeight: '600',
    minWidth: 48,
    textAlign: 'center',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  optionChipActive: {
    backgroundColor: 'rgba(0,255,204,0.15)',
    borderColor: '#00FFCC',
  },
  optionChipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  optionChipTextActive: {
    color: '#00FFCC',
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorSwatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  colorSwatchActive: {
    borderColor: '#00FFCC',
    shadowColor: '#00FFCC',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  colorInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },
  unsupportedText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
});
