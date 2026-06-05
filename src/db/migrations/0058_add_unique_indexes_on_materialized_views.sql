CREATE UNIQUE INDEX "uq_mv_kpi_backup_counts_singleton" ON "mv_kpi_backup_counts" USING btree ("singleton");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mv_kpi_evolution_monthly_period" ON "mv_kpi_evolution_monthly" USING btree ("period");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mv_kpi_storage_treemap_provider" ON "mv_kpi_storage_treemap" USING btree ("provider");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_mv_kpi_dbms_treemap_dbms" ON "mv_kpi_dbms_treemap" USING btree ("dbms");
