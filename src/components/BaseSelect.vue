<script setup lang="ts">
import { ref } from 'vue';
import { onClickOutside } from '@vueuse/core';
import { ChevronDown, Check } from 'lucide-vue-next';

interface Option {
  label: string;
  value: string | number;
}

const props = defineProps<{
  modelValue: string | number;
  options: Option[];
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void;
  (e: 'change', value: string | number): void;
}>();

const isOpen = ref(false);
const target = ref(null);

onClickOutside(target, () => (isOpen.value = false));

const select = (value: string | number) => {
  emit('update:modelValue', value);
  emit('change', value);
  isOpen.value = false;
};

const currentLabel = () => {
  const opt = props.options.find((o) => o.value === props.modelValue);
  return opt ? opt.label : props.placeholder || String(props.modelValue);
};
</script>

<template>
  <div class="relative min-w-[120px]" ref="target">
    <button
      type="button"
      @click="isOpen = !isOpen"
      class="relative w-full cursor-pointer rounded-lg bg-white dark:bg-gray-700 py-2.5 pl-4 pr-10 text-left text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 sm:text-sm sm:leading-6 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
    >
      <span class="block truncate font-medium">{{ currentLabel() }}</span>
      <span class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
        <ChevronDown class="h-4 w-4 text-gray-400 transition-transform duration-200" :class="{ 'rotate-180': isOpen }" aria-hidden="true" />
      </span>
    </button>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95 translate-y-[-10px]"
      enter-to-class="transform opacity-100 scale-100 translate-y-0"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform opacity-100 scale-100 translate-y-0"
      leave-to-class="transform opacity-0 scale-95 translate-y-[-10px]"
    >
      <ul
        v-if="isOpen"
        class="absolute z-20 mt-2 max-h-60 w-full overflow-auto rounded-lg bg-white dark:bg-gray-700 py-1 text-base shadow-xl ring-1 ring-black/5 focus:outline-none sm:text-sm"
      >
        <li
          v-for="option in options"
          :key="option.value"
          class="relative cursor-pointer select-none py-2.5 pl-4 pr-9 text-gray-700 dark:text-gray-200 hover:bg-purple-50 dark:hover:bg-gray-600 transition-colors"
          :class="[modelValue === option.value ? 'bg-purple-50 dark:bg-gray-600 text-purple-700 dark:text-purple-300 font-medium' : '']"
          @click="select(option.value)"
        >
          <span :class="[modelValue === option.value ? 'font-medium' : 'font-normal', 'block truncate']">
            {{ option.label }}
          </span>

          <span
            v-if="modelValue === option.value"
            class="absolute inset-y-0 right-0 flex items-center pr-3 text-purple-600 dark:text-purple-400"
          >
            <Check class="h-4 w-4" aria-hidden="true" />
          </span>
        </li>
      </ul>
    </transition>
  </div>
</template>
