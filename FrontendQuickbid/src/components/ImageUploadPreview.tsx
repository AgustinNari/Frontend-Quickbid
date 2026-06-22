import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MobileImage } from '../mobile/mediaPicker';
import { colors, fontSize, fontWeight, radius, spacing } from '../theme';
import { Icon } from '../ui';

export function ImageUploadPreview({
  image,
  onRemove,
  onReplace,
}: {
  image: MobileImage;
  onRemove: () => void;
  onReplace: () => void;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [image.uri]);

  return (
    <View style={styles.card}>
      <View style={styles.imageWrap}>
        {failed ? (
          <View style={styles.fallback}>
            <Icon name="image" size={30} color={colors.textSubtle} />
            <Text style={styles.fallbackText}>Sin vista previa</Text>
          </View>
        ) : (
          <Image
            source={{ uri: image.uri }}
            style={styles.image}
            resizeMode="cover"
            onError={() => setFailed(true)}
          />
        )}
        <TouchableOpacity
          accessibilityLabel={`Eliminar ${image.name}`}
          onPress={onRemove}
          style={styles.remove}
        >
          <Text style={styles.removeText}>×</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <View style={styles.metadata}>
          <Text style={styles.name} numberOfLines={1}>
            {image.name}
          </Text>
          <Text style={styles.meta}>
            {image.type}
            {image.sizeBytes != null ? ` · ${formatBytes(image.sizeBytes)}` : ''}
          </Text>
        </View>
        <TouchableOpacity onPress={onReplace} style={styles.replace}>
          <Text style={styles.replaceText}>Cambiar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  imageWrap: { height: 150, backgroundColor: colors.surfaceMuted },
  image: { width: '100%', height: '100%' },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  fallbackText: { color: colors.textMuted, fontSize: fontSize.sm },
  remove: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: colors.textInverse,
    fontSize: 24,
    lineHeight: 26,
    fontWeight: fontWeight.bold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  metadata: { flex: 1 },
  name: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  meta: { color: colors.textMuted, fontSize: fontSize.xs, marginTop: 2 },
  replace: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  replaceText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
