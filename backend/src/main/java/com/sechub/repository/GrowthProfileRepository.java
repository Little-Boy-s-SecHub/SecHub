package com.sechub.repository;
import com.sechub.entity.GrowthProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;
public interface GrowthProfileRepository extends JpaRepository<GrowthProfile,UUID>{ Optional<GrowthProfile> findByUserId(UUID userId); }
