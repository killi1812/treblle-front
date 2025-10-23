<template>
  <v-app-bar color="primary" :elevation="8" height="60">
    <v-app-bar-nav-icon class="text-white" @click="open = !open"></v-app-bar-nav-icon>
    <img id="logo" src="../../assets/logo.png" alt="logo" />
    <v-app-bar-title>Api Analytics</v-app-bar-title>
    <v-spacer></v-spacer>
    <v-btn icon @click="router.back()">
      <v-icon>mdi-arrow-left</v-icon>
    </v-btn>

  </v-app-bar>

  <v-navigation-drawer class="offset" :rail="!open" rail-width="60" location="left" permanent persistent elevation="2">
    <v-list nav>
      <!-- Information section -->
      <v-list-item v-show="open" readonly>Information</v-list-item>
      <v-divider></v-divider>
      <IconListItem to="/" icon="mdi-home" tooltip-text="Dashboard" :show-tooltip="!open">
        Home
      </IconListItem>
      <!-- Master Data section -->
      <v-list-item v-show="open" readonly>Master Data</v-list-item>
      <v-divider></v-divider>
      <IconListItem to="/data/search" icon="mdi-list-box" tooltip-text="Search" :show-tooltip="!open">
        Search
      </IconListItem>
      <IconListItem to="/data/chart" icon="mdi-chart-box" tooltip-text="Chart" :show-tooltip="!open">
        Chart
      </IconListItem>
      <!-- Master Data section -->
      <v-list-item v-show="open" readonly>Information</v-list-item>
      <v-divider></v-divider>
      <IconListItem to="/help/help" icon="mdi-help-circle" tooltip-text="Help" :show-tooltip="!open">
        Help
      </IconListItem>
      <IconListItem to="/help/about" icon="mdi-information" tooltip-text="About" :show-tooltip="!open">
        About
      </IconListItem>
    </v-list>
  </v-navigation-drawer>

</template>


<script lang="ts" setup>

const open = ref(false)
const router = useRouter()

</script>
<style lang="css" scoped>
#logo {
  width: 40px;
  height: 30px;
}

.offset {
  padding-bottom: 40px;
}

.uppercase {
  text-transform: uppercase;
}
</style>
