-- Custom SQL migration file, put your code below! --


DO $$
    DECLARE
        org RECORD;
        proj RECORD;
        db RECORD;
    BEGIN
        FOR org IN SELECT id FROM organization LOOP
                FOR proj IN
                    SELECT id FROM projects WHERE organization_id = org.id
                    LOOP
                        FOR db IN
                            SELECT agent_id FROM databases WHERE project_id = proj.id
                            LOOP
                                IF db.agent_id IS NOT NULL THEN
                                    INSERT INTO organization_agents (
                                        organization_id,
                                        agent_id
                                    )
                                    VALUES (
                                               org.id,
                                               db.agent_id
                                           )
                                    ON CONFLICT (organization_id, agent_id) DO NOTHING;
                                END IF;
                            END LOOP;
                    END LOOP;
            END LOOP;
    END $$;